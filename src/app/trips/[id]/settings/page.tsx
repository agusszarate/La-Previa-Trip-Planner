import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsPageClient from "./SettingsPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (!trip) redirect("/dashboard");

  const { data: member } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", id)
    .eq("user_id", user.id)
    .single();

  const isOwner = member?.role === "owner";

  return (
    <SettingsPageClient
      trip={trip}
      tripId={id}
      isOwner={isOwner}
    />
  );
}
