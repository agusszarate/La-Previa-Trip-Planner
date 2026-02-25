import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteClient from "./InviteClient";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up invite
  const { data: invite } = await supabase
    .from("trip_invites")
    .select("*, trips(*)")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (!invite || !invite.trips) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Invitación inválida
          </h1>
          <p className="text-gray-500">
            Este link de invitación no existe o ya expiró.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if already a member
    const { data: existing } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", invite.trip_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      redirect(`/trips/${invite.trip_id}`);
    }

    // Auto-join
    await supabase.from("trip_members").insert({
      trip_id: invite.trip_id,
      user_id: user.id,
      role: "member",
    });

    redirect(`/trips/${invite.trip_id}`);
  }

  // Not logged in — show invite page with login
  return <InviteClient trip={invite.trips} code={code} />;
}
