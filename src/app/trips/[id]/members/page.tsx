import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MembersPageClient from "./MembersPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: Props) {
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

  const userMember = members?.find((m) => m.user_id === user.id);

  return (
    <MembersPageClient
      members={members || []}
      tripId={id}
      isOwner={userMember?.role === "owner"}
      currentUserId={user.id}
    />
  );
}
