import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { accommodationId, url } = await request.json();

    if (!url || !accommodationId) {
      return NextResponse.json(
        { error: "Missing url or accommodationId" },
        { status: 400 }
      );
    }

    // Fetch the Airbnb page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 500 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract data from meta tags and structured data
    const name =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      null;

    const description =
      $('meta[property="og:description"]').attr("content") || null;

    const image =
      $('meta[property="og:image"]').attr("content") || null;

    // Try to find price from JSON-LD structured data
    let price: number | null = null;
    let currency: string | null = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        if (data["@type"] === "Product" || data["@type"] === "LodgingBusiness") {
          if (data.offers?.price) {
            price = parseFloat(data.offers.price);
            currency = data.offers.priceCurrency || "USD";
          }
        }
        // Sometimes nested
        if (data?.offers?.lowPrice) {
          price = parseFloat(data.offers.lowPrice);
          currency = data.offers.priceCurrency || "USD";
        }
      } catch {
        // Invalid JSON, skip
      }
    });

    // Fallback: try to extract price from meta tags
    if (!price) {
      const priceMatch = html.match(/"price":\s*(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
      const currencyMatch = html.match(/"currency":\s*"([A-Z]{3})"/);
      if (currencyMatch) {
        currency = currencyMatch[1];
      }
    }

    // Extract location
    const location =
      $('meta[property="og:locality"]').attr("content") ||
      $('meta[name="geo.placename"]').attr("content") ||
      null;

    // Extract rating
    let rating: number | null = null;
    const ratingMatch = html.match(/"ratingValue":\s*(\d+(?:\.\d+)?)/);
    if (ratingMatch) {
      rating = parseFloat(ratingMatch[1]);
    }

    // Update accommodation in database
    const supabase = await createClient();

    const updateData: Record<string, any> = {
      last_scraped_at: new Date().toISOString(),
    };

    if (name) updateData.name = name.replace(" - Airbnb", "").trim();
    if (price) updateData.price_per_night = price;
    if (currency) updateData.currency = currency;
    if (location) updateData.location = location;
    if (rating) updateData.rating = rating;
    if (image) updateData.image_url = image;

    // Append to price history
    if (price) {
      const { data: existing } = await supabase
        .from("accommodations")
        .select("price_history")
        .eq("id", accommodationId)
        .single();

      const history = existing?.price_history || [];
      history.push({
        date: new Date().toISOString(),
        price,
      });
      updateData.price_history = history;
    }

    await supabase
      .from("accommodations")
      .update(updateData)
      .eq("id", accommodationId);

    return NextResponse.json({
      success: true,
      data: { name: updateData.name, price, currency, location, rating },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
