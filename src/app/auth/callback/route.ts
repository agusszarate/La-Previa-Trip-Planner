import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If redirecting to dashboard (default), check if user needs onboarding
      if (next === "/dashboard") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("id", user.id)
            .single();

          if (profile) {
            const emailPrefix = profile.email.split("@")[0];
            if (!profile.display_name || profile.display_name === emailPrefix) {
              return NextResponse.redirect(`${origin}/onboarding`);
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth`);
}
