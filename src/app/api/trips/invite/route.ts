import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "@/lib/utils";

// Generate an invite link for a trip
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tripId } = await request.json();

  // Verify user is owner
  const { data: member } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Only owners can invite" }, { status: 403 });
  }

  // Generate invite code and store it in trip metadata
  // We'll use the trip description field with a special prefix, or better,
  // we store it as a simple mapping. For simplicity, we'll use a deterministic
  // code based on the trip ID (first 8 chars) + a random suffix
  const code = nanoid(10);

  // Store invite code — we'll add an invite_codes table
  // For now, use a simple approach: store in trip metadata
  const { error } = await supabase.from("trip_invites").insert({
    trip_id: tripId,
    code,
    created_by: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/invite/${code}`;

  return NextResponse.json({ code, url: inviteUrl });
}
