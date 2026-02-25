import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { sendEmail, flightAlertEmail } from "@/lib/email";

// This endpoint is called by GitHub Actions or Vercel Cron
// It checks flight prices and sends alerts

export async function GET(request: Request) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role for cron (bypasses RLS)
  // Note: you'll need SUPABASE_SERVICE_ROLE_KEY env var for this
  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get active flight watches
  const { data: watches } = await supabase
    .from("flights_watchlist")
    .select("*")
    .eq("is_active", true);

  if (!watches || watches.length === 0) {
    return NextResponse.json({ message: "No active watches", checked: 0 });
  }

  const results = [];

  for (const watch of watches) {
    try {
      // Use Kiwi Tequila API (free tier)
      // Docs: https://tequila.kiwi.com/portal/docs/tequila_api
      const searchUrl = new URL("https://api.tequila.kiwi.com/v2/search");
      searchUrl.searchParams.set("fly_from", watch.origin);
      searchUrl.searchParams.set("fly_to", watch.destination);
      searchUrl.searchParams.set(
        "date_from",
        formatDate(watch.date_from)
      );
      if (watch.date_to) {
        searchUrl.searchParams.set(
          "return_from",
          formatDate(watch.date_to)
        );
        searchUrl.searchParams.set(
          "return_to",
          formatDate(watch.date_to)
        );
      }
      searchUrl.searchParams.set("curr", watch.currency || "ARS");
      searchUrl.searchParams.set("limit", "1");
      searchUrl.searchParams.set("sort", "price");

      const flightRes = await fetch(searchUrl.toString(), {
        headers: {
          apikey: process.env.KIWI_API_KEY || "",
        },
      });

      if (!flightRes.ok) {
        results.push({
          watch_id: watch.id,
          status: "error",
          error: `Kiwi API returned ${flightRes.status}`,
        });
        continue;
      }

      const flightData = await flightRes.json();
      const cheapest = flightData.data?.[0];

      if (!cheapest) {
        results.push({ watch_id: watch.id, status: "no_results" });
        continue;
      }

      const price = cheapest.price;
      const previousPrice = watch.last_price;

      // Update watch
      const updates: Record<string, any> = {
        last_price: price,
        last_checked_at: new Date().toISOString(),
      };

      if (!watch.lowest_price || price < watch.lowest_price) {
        updates.lowest_price = price;
      }

      await supabase
        .from("flights_watchlist")
        .update(updates)
        .eq("id", watch.id);

      // Send alert if price dropped below max_price
      const shouldAlert =
        watch.alert_email &&
        watch.max_price &&
        price <= watch.max_price &&
        (!previousPrice || price < previousPrice);

      if (shouldAlert) {
        await sendEmail({
          to: watch.alert_email!,
          subject: `✈️ Vuelo ${watch.origin}→${watch.destination}: ${price} ${watch.currency}`,
          html: flightAlertEmail(
            {
              origin: watch.origin,
              destination: watch.destination,
              price,
              currency: watch.currency || "ARS",
            },
            previousPrice || undefined
          ),
        });
      }

      results.push({
        watch_id: watch.id,
        status: "ok",
        price,
        alerted: shouldAlert,
      });
    } catch (error: any) {
      results.push({
        watch_id: watch.id,
        status: "error",
        error: error.message,
      });
    }
  }

  return NextResponse.json({
    message: "Cron completed",
    checked: watches.length,
    results,
  });
}

// Kiwi API expects dd/mm/yyyy
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
