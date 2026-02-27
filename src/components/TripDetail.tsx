"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateDebts } from "@/lib/debts";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import ComboBuilder from "./ComboBuilder";
import CategoryOptionsTab from "./trip/CategoryOptionsTab";
import TransportTab from "./trip/TransportTab";
import PreviewTab from "./trip/PreviewTab";
import { TABS } from "./trip/constants";
import Link from "next/link";
import type {
  Trip,
  TripMember,
  Expense,
  FlightWatch,
  TripOption,
  CurrencyType,
} from "@/lib/types";

interface Props {
  trip: Trip;
  members: TripMember[];
  expenses: Expense[];
  flights: FlightWatch[];
  tripOptions: TripOption[];
  currentUserId: string;
}

export default function TripDetail({
  trip,
  members,
  expenses,
  flights,
  tripOptions,
  currentUserId,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("combo");
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

  const categoryTabProps = {
    options: tripOptions,
    members,
    tripId: trip.id,
    currentUserId,
    supabase,
    refresh,
    exchangeRates: rates,
  };

  return (
    <div>
      {/* Hero: Trip Info + Summary */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl border border-blue-200/60 dark:border-slate-700 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resumen</h2>
          {trip.start_date && (
            <span className="text-sm text-gray-600 dark:text-slate-400">
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
            </span>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {Object.entries(totals).map(([currency, total]) => (
            <div
              key={currency}
              className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/60 dark:border-slate-600 p-3"
            >
              <p className="text-xs text-gray-500 dark:text-slate-400">Total ({currency})</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
          {arsEquivalentTotal !== null && (
            <div className="bg-green-50/80 dark:bg-green-950/50 rounded-xl border border-green-200/60 dark:border-green-800 p-3">
              <p className="text-xs text-green-700 dark:text-green-400">≈ Total en ARS</p>
              <p className="text-xl font-bold text-green-800 dark:text-green-300">
                ${arsEquivalentTotal.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">Dólar blue</p>
            </div>
          )}
          {hasMultipleCurrencies && ratesLoading && (
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/60 dark:border-slate-600 p-3">
              <p className="text-xs text-gray-500 dark:text-slate-400">≈ Total en ARS</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Cargando...</p>
            </div>
          )}
          {Object.keys(totals).length === 0 && (
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/60 dark:border-slate-600 p-3 col-span-2">
              <p className="text-xs text-gray-500 dark:text-slate-400">Sin gastos aún</p>
            </div>
          )}
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/60 dark:border-slate-600 p-3">
            <p className="text-xs text-gray-500 dark:text-slate-400">Deudas pendientes</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{debts.length}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-200/40 dark:border-slate-600">
          <span className="text-xs text-gray-500 dark:text-slate-400 self-center mr-1">👥 {members.length} miembros</span>
          <Link
            href={`/trips/${trip.id}/members`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Ver miembros →
          </Link>
          <span className="text-gray-300 dark:text-slate-600 mx-1">·</span>
          <Link
            href={`/trips/${trip.id}/expenses`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Ver gastos →
          </Link>
        </div>
      </div>

      {/* Category tabs */}
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
      {activeTab === "combo" && (
        <ComboBuilder
          options={tripOptions}
          members={members}
          tripId={trip.id}
          currentUserId={currentUserId}
          supabase={supabase}
          exchangeRates={rates}
        />
      )}
      {activeTab === "preview" && (
        <PreviewTab
          options={tripOptions}
          members={members}
          exchangeRates={rates}
        />
      )}
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
          exchangeRates={rates}
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
    </div>
  );
}
