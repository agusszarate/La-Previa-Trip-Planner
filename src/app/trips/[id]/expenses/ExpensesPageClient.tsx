"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import ExpensesTab from "@/components/trip/ExpensesTab";
import type { Expense, TripMember, Debt } from "@/lib/types";

interface Props {
  expenses: Expense[];
  members: TripMember[];
  debts: Debt[];
  tripId: string;
  currentUserId: string;
}

export default function ExpensesPageClient({
  expenses,
  members,
  debts,
  tripId,
  currentUserId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { rates } = useExchangeRates();

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gastos</h2>
      <ExpensesTab
        expenses={expenses}
        members={members}
        debts={debts}
        tripId={tripId}
        currentUserId={currentUserId}
        supabase={supabase}
        refresh={() => router.refresh()}
        exchangeRates={rates}
      />
    </div>
  );
}
