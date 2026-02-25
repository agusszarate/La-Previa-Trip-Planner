import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import TripDetail from "@/components/TripDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  // Get trip
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!trip) redirect("/dashboard");

  // Get members with profiles
  const { data: members } = await supabase
    .from("trip_members")
    .select("*, profiles(*)")
    .eq("trip_id", id);

  // Get expenses with splits and payer info
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles:paid_by(id, display_name, email), expense_splits(*)")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  // Get accommodations
  const { data: accommodations } = await supabase
    .from("accommodations")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  // Get flight watches
  const { data: flights } = await supabase
    .from("flights_watchlist")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  // Get checklist
  const { data: checklist } = await supabase
    .from("checklist_items")
    .select("*, profiles:assigned_to(id, display_name, email)")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

  // Check user role
  const userMember = members?.find((m) => m.user_id === user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={profile} />
      <TripDetail
        trip={trip}
        members={members || []}
        expenses={expenses || []}
        accommodations={accommodations || []}
        flights={flights || []}
        checklist={checklist || []}
        currentUserId={user.id}
        isOwner={userMember?.role === "owner"}
      />
    </div>
  );
}
