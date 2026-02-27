import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user is the owner
  const { data: member } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete in order respecting foreign keys
  const { data: expenseIds } = await supabase
    .from("expenses")
    .select("id")
    .eq("trip_id", tripId);

  if (expenseIds && expenseIds.length > 0) {
    await supabase
      .from("expense_splits")
      .delete()
      .in("expense_id", expenseIds.map((e) => e.id));
  }

  await supabase.from("expenses").delete().eq("trip_id", tripId);
  await supabase.from("checklist_items").delete().eq("trip_id", tripId);
  await supabase.from("trip_options").delete().eq("trip_id", tripId);
  await supabase.from("saved_combos").delete().eq("trip_id", tripId);
  await supabase.from("flights_watchlist").delete().eq("trip_id", tripId);
  await supabase.from("trip_members").delete().eq("trip_id", tripId);

  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
