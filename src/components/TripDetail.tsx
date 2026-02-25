"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateDebts } from "@/lib/debts";
import ComboBuilder from "./ComboBuilder";
import ExpensesTab from "./trip/ExpensesTab";
import MembersTab from "./trip/MembersTab";
import AccommodationsTab from "./trip/AccommodationsTab";
import FlightsTab from "./trip/FlightsTab";
import ChecklistTab from "./trip/ChecklistTab";
import PreviewTab from "./trip/PreviewTab";
import { TABS } from "./trip/constants";
import type {
  Trip,
  TripMember,
  Expense,
  Accommodation,
  FlightWatch,
  ChecklistItem,
  TripOption,
} from "@/lib/types";

interface Props {
  trip: Trip;
  members: TripMember[];
  expenses: Expense[];
  accommodations: Accommodation[];
  flights: FlightWatch[];
  checklist: ChecklistItem[];
  tripOptions: TripOption[];
  currentUserId: string;
  isOwner: boolean;
}

export default function TripDetail({
  trip,
  members,
  expenses,
  accommodations,
  flights,
  checklist,
  tripOptions,
  currentUserId,
  isOwner,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("combo");
  const router = useRouter();
  const supabase = createClient();

  const memberInfos = members.map((m) => ({
    id: m.user_id,
    name: m.profiles?.display_name || m.profiles?.email || "?",
  }));
  const debts = calculateDebts(expenses, memberInfos);

  const totals = expenses.reduce((acc, e) => {
    acc[e.currency] = (acc[e.currency] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  function refresh() {
    router.refresh();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Trip Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-3 flex items-center gap-1 text-sm"
        >
          ← Mis viajes
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{trip.name}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-slate-400">
          {trip.destination && <span>📍 {trip.destination}</span>}
          {trip.start_date && (
            <span>
              📅{" "}
              {new Date(trip.start_date).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {trip.end_date &&
                ` — ${new Date(trip.end_date).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                })}`}
            </span>
          )}
          <span>👥 {members.length} personas</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(totals).map(([currency, total]) => (
          <div
            key={currency}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4"
          >
            <p className="text-sm text-gray-500 dark:text-slate-400">Total ({currency})</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
        {Object.keys(totals).length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 col-span-2">
            <p className="text-sm text-gray-500 dark:text-slate-400">Sin gastos aún</p>
            <p className="text-lg text-gray-400 dark:text-slate-500">Agregá el primer gasto</p>
          </div>
        )}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-slate-400">Deudas pendientes</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{debts.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto hide-scrollbar bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "combo" && (
        <ComboBuilder
          options={tripOptions}
          members={members}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
        />
      )}
      {activeTab === "preview" && (
        <PreviewTab
          options={tripOptions}
          members={members}
        />
      )}
      {activeTab === "gastos" && (
        <ExpensesTab
          expenses={expenses}
          members={members}
          debts={debts}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          refresh={refresh}
        />
      )}
      {activeTab === "miembros" && (
        <MembersTab
          members={members}
          tripId={trip.id}
          isOwner={isOwner}
          supabase={supabase}
          refresh={refresh}
        />
      )}
      {activeTab === "alojamiento" && (
        <AccommodationsTab
          accommodations={accommodations}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          refresh={refresh}
        />
      )}
      {activeTab === "vuelos" && (
        <FlightsTab
          flights={flights}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          refresh={refresh}
        />
      )}
      {activeTab === "checklist" && (
        <ChecklistTab
          checklist={checklist}
          members={members}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          refresh={refresh}
        />
      )}
    </main>
  );
}
