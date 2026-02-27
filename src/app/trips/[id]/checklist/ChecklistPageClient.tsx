"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChecklistTab from "@/components/trip/ChecklistTab";
import type { ChecklistItem, TripMember } from "@/lib/types";

interface Props {
  checklist: ChecklistItem[];
  members: TripMember[];
  tripId: string;
  currentUserId: string;
}

export default function ChecklistPageClient({
  checklist,
  members,
  tripId,
  currentUserId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Checklist</h2>
      <ChecklistTab
        checklist={checklist}
        members={members}
        tripId={tripId}
        currentUserId={currentUserId}
        supabase={supabase}
        refresh={() => router.refresh()}
      />
    </div>
  );
}
