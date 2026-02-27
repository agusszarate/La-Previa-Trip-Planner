"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MembersTab from "@/components/trip/MembersTab";
import type { TripMember } from "@/lib/types";

interface Props {
  members: TripMember[];
  tripId: string;
  isOwner: boolean;
  currentUserId: string;
}

export default function MembersPageClient({ members, tripId, isOwner, currentUserId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Miembros</h2>
      <MembersTab
        members={members}
        tripId={tripId}
        isOwner={isOwner}
        currentUserId={currentUserId}
        supabase={supabase}
        refresh={() => router.refresh()}
      />
    </div>
  );
}
