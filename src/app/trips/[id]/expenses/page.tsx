import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateDebts } from "@/lib/debts";
import ExpensesPageClient from "./ExpensesPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExpensesPage({ params }: Props) {
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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles:paid_by(id, display_name, email), expense_splits(*)")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  const memberInfos = (members || []).map((m) => ({
    id: m.user_id,
    name: m.profiles?.display_name || m.profiles?.email || "?",
  }));
  const debts = calculateDebts(expenses || [], memberInfos);

  return (
    <ExpensesPageClient
      expenses={expenses || []}
      members={members || []}
      debts={debts}
      tripId={id}
      currentUserId={user.id}
    />
  );
}
