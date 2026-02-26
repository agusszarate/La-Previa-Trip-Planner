"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateDebts } from "@/lib/debts";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import ComboBuilder from "./ComboBuilder";
import CategoryOptionsTab from "./trip/CategoryOptionsTab";
import TransportTab from "./trip/TransportTab";
import ExpensesTab from "./trip/ExpensesTab";
import MembersTab from "./trip/MembersTab";
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
  CurrencyType,
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
  const [activeTab, setActiveTab] = useState<string>("info");
  const router = useRouter();
  const supabase = createClient();
  const { rates, loading: ratesLoading, convertToARS } = useExchangeRates();

  const memberInfos = members.map((m) => ({
    id: m.user_id,
    name: m.profiles?.display_name || m.profiles?.email || "?",
  }));
  const debts = calculateDebts(expenses, memberInfos);

  const totals = expenses.reduce((acc, e) => {
    acc[e.currency] = (acc[e.currency] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate ARS equivalent total across all currencies
  const hasMultipleCurrencies = Object.keys(totals).length > 1;
  const arsEquivalentTotal = hasMultipleCurrencies && rates
    ? Object.entries(totals).reduce((sum, [currency, amount]) => {
        const converted = convertToARS(amount, currency as CurrencyType);
        return converted !== null ? sum + converted : sum;
      }, 0)
    : null;

  function refresh() {
    router.refresh();
  }

  // Shared props for category option tabs
  const categoryTabProps = {
    options: tripOptions,
    members,
    tripId: trip.id,
    currentUserId,
    supabase,
    refresh,
  };

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Compact header + back */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-sm"
        >
          ← Mis viajes
        </button>
        <span className="text-gray-300 dark:text-slate-600">/</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{trip.name}</h1>
      </div>

      {/* Tabs — flex-wrap, no scroll */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Trip details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Información del viaje</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {trip.destination && (
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Destino</p>
                  <p className="font-medium text-gray-900 dark:text-white">📍 {trip.destination}</p>
                </div>
              )}
              {trip.start_date && (
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Fechas</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    📅{" "}
                    {new Date(trip.start_date + "T12:00:00").toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {trip.end_date &&
                      ` — ${new Date(trip.end_date + "T12:00:00").toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                      })}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500 dark:text-slate-400">Miembros</p>
                <p className="font-medium text-gray-900 dark:text-white">👥 {members.length} personas</p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            {arsEquivalentTotal !== null && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-4">
                <p className="text-sm text-green-700 dark:text-green-400">≈ Total en ARS</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  ${arsEquivalentTotal.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Dólar blue</p>
              </div>
            )}
            {hasMultipleCurrencies && ratesLoading && (
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">≈ Total en ARS</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Cargando cotizaciones...</p>
              </div>
            )}
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

          {/* Members quick list */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Integrantes</h3>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <span
                  key={m.user_id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-700 dark:text-slate-300"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {m.profiles?.display_name || m.profiles?.email || "?"}
                  {m.role === "owner" && <span className="text-xs text-yellow-600 dark:text-yellow-400">👑</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
          exchangeRates={rates}
        />
      )}

      {/* Category tabs */}
      {activeTab === "accommodation" && (
        <CategoryOptionsTab {...categoryTabProps} category="accommodation" categoryLabel="Alojamiento" />
      )}
      {activeTab === "transport" && (
        <TransportTab
          options={tripOptions}
          flights={flights}
          members={members}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          refresh={refresh}
        />
      )}
      {activeTab === "tickets" && (
        <CategoryOptionsTab {...categoryTabProps} category="tickets" categoryLabel="Entradas" />
      )}
      {activeTab === "gear" && (
        <CategoryOptionsTab {...categoryTabProps} category="gear" categoryLabel="Equipamiento" />
      )}
      {activeTab === "food" && (
        <CategoryOptionsTab {...categoryTabProps} category="food" categoryLabel="Comida" />
      )}
      {activeTab === "activities" && (
        <CategoryOptionsTab {...categoryTabProps} category="activities" categoryLabel="Actividades" />
      )}
      {activeTab === "other" && (
        <CategoryOptionsTab {...categoryTabProps} category="other" categoryLabel="Otros" />
      )}

      {/* Utility tabs */}
      {activeTab === "expenses" && (
        <ExpensesTab
          expenses={expenses}
          members={members}
          debts={debts}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          refresh={refresh}
          exchangeRates={rates}
        />
      )}
      {activeTab === "members" && (
        <MembersTab
          members={members}
          tripId={trip.id}
          isOwner={isOwner}
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
