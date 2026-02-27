import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChecklistPageClient from "./ChecklistPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChecklistPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: trip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", id)
    .single();

  if (!trip) redirect("/dashboard");

  const { data: members } = await supabase
    .from("trip_members")
    .select("*, profiles(*)")
    .eq("trip_id", id);

  const { data: checklist } = await supabase
    .from("checklist_items")
    .select("*, profiles:assigned_to(id, display_name, email)")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

  return (
    <ChecklistPageClient
      checklist={checklist || []}
      members={members || []}
      tripId={id}
      currentUserId={user.id}
    />
  );
}
