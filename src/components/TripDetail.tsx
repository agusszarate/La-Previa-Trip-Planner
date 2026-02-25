"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateDebts } from "@/lib/debts";
import ComboBuilder from "./ComboBuilder";
import type {
  Trip,
  TripMember,
  Expense,
  Accommodation,
  FlightWatch,
  ChecklistItem,
  TripOption,
  OptionCategory,
  ExpenseCategory,
  CurrencyType,
} from "@/lib/types";

const TABS = [
  { id: "combo", label: "Armar Combo", icon: "🎯" },
  { id: "preview", label: "Preview", icon: "👁️" },
  { id: "gastos", label: "Gastos", icon: "💰" },
  { id: "miembros", label: "Miembros", icon: "👥" },
  { id: "alojamiento", label: "Alojamiento", icon: "🏠" },
  { id: "vuelos", label: "Vuelos", icon: "✈️" },
  { id: "checklist", label: "Checklist", icon: "✅" },
] as const;

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "alojamiento", label: "🏠 Alojamiento" },
  { value: "transporte", label: "🚗 Transporte" },
  { value: "comida", label: "🍕 Comida" },
  { value: "equipamiento", label: "🎿 Equipamiento" },
  { value: "skipass", label: "🎫 Ski Pass" },
  { value: "actividades", label: "⛷️ Actividades" },
  { value: "otros", label: "📦 Otros" },
];

const CURRENCIES: CurrencyType[] = ["ARS", "USD", "EUR", "BRL"];

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

  // Debt calculation
  const memberInfos = members.map((m) => ({
    id: m.user_id,
    name: m.profiles?.display_name || m.profiles?.email || "?",
  }));
  const debts = calculateDebts(expenses, memberInfos);

  // Total by currency
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

// ============ EXPENSES TAB ============
function ExpensesTab({
  expenses,
  members,
  debts,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "ARS" as CurrencyType,
    category: "otros" as ExpenseCategory,
    paid_by: currentUserId,
    split_type: "equal",
  });
  const [loading, setLoading] = useState(false);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Ingresá un monto válido");
      setLoading(false);
      return;
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        description: form.description,
        amount,
        currency: form.currency,
        category: form.category,
        paid_by: form.paid_by,
        split_type: form.split_type,
      })
      .select()
      .single();

    if (error || !expense) {
      alert("Error: " + error?.message);
      setLoading(false);
      return;
    }

    // Create equal splits
    if (form.split_type === "equal") {
      const splitAmount = amount / members.length;
      const splits = members.map((m: any) => ({
        expense_id: expense.id,
        user_id: m.user_id,
        amount: Math.round(splitAmount * 100) / 100,
      }));

      await supabase.from("expense_splits").insert(splits);
    }

    setForm({
      description: "",
      amount: "",
      currency: "ARS",
      category: "otros",
      paid_by: currentUserId,
      split_type: "equal",
    });
    setShowForm(false);
    setLoading(false);
    refresh();
  }

  return (
    <div className="space-y-4">
      {/* Debts Summary */}
      {debts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-3">
            Quién le debe a quién
          </h3>
          <div className="space-y-2">
            {debts.map((d: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200">
                  <strong>{d.from_name}</strong> → <strong>{d.to_name}</strong>
                </span>
                <span className="font-semibold text-orange-700 dark:text-orange-400">
                  {d.amount.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {d.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Button/Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
        >
          + Agregar gasto
        </button>
      ) : (
        <form
          onSubmit={handleAddExpense}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-800 dark:text-slate-100">Nuevo Gasto</h3>

          <input
            type="text"
            required
            placeholder="¿Qué se pagó?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              required
              step="0.01"
              placeholder="Monto"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <select
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value as CurrencyType })
              }
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ExpenseCategory,
                })
              }
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={form.paid_by}
              onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            >
              {members.map((m: any) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.display_name || m.profiles?.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Expense List */}
      <div className="space-y-3">
        {expenses.map((exp: Expense) => (
          <div
            key={exp.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {
                    CATEGORIES.find((c) => c.value === exp.category)?.label
                  }{" "}
                  · Pagó{" "}
                  {(exp as any).profiles?.display_name ||
                    (exp as any).profiles?.email}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
                  {exp.amount.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{exp.currency}</p>
              </div>
            </div>
            {/* Splits detail */}
            {exp.expense_splits && exp.expense_splits.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">División:</p>
                <div className="flex flex-wrap gap-2">
                  {exp.expense_splits.map((split: any) => {
                    const member = members.find(
                      (m: any) => m.user_id === split.user_id
                    );
                    return (
                      <span
                        key={split.id}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          split.is_settled
                            ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                        }`}
                      >
                        {member?.profiles?.display_name ||
                          member?.profiles?.email ||
                          "?"}{" "}
                        {split.amount.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                        {split.is_settled ? " ✓" : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Actions */}
            {exp.paid_by === currentUserId && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3">
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar este gasto?")) return;
                    await supabase.from("expenses").delete().eq("id", exp.id);
                    refresh();
                  }}
                  className="text-xs text-red-500 hover:text-red-700 transition"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="text-center text-gray-400 dark:text-slate-500 py-8">
            No hay gastos todavía
          </p>
        )}
      </div>

      {/* Settle Debts */}
      {debts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h3 className="font-semibold text-green-800 mb-3">
            Marcar como pagado
          </h3>
          <div className="space-y-2">
            {debts.map((d: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200">
                  <strong>{d.from_name}</strong> → <strong>{d.to_name}</strong>:{" "}
                  {d.amount.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {d.currency}
                </span>
                {(d.from === currentUserId || d.to === currentUserId) && (
                  <button
                    onClick={async () => {
                      // Mark all splits between these two users as settled
                      const relatedExpenses = expenses.filter(
                        (e: Expense) => e.paid_by === d.to
                      );
                      for (const exp of relatedExpenses) {
                        if (!exp.expense_splits) continue;
                        const split = exp.expense_splits.find(
                          (s: any) => s.user_id === d.from && !s.is_settled
                        );
                        if (split) {
                          await supabase
                            .from("expense_splits")
                            .update({
                              is_settled: true,
                              settled_at: new Date().toISOString(),
                            })
                            .eq("id", split.id);
                        }
                      }
                      refresh();
                    }}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    Pagado ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MEMBERS TAB ============
function MembersTab({ members, tripId, isOwner, supabase, refresh }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  async function handleGenerateInvite() {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/trips/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = data.url.startsWith("http")
          ? data.url
          : `${window.location.origin}/invite/${data.code}`;
        setInviteLink(fullUrl);
        navigator.clipboard.writeText(fullUrl).catch(() => {});
      } else {
        alert("Error: " + (data.error || "No se pudo generar"));
      }
    } catch {
      alert("Error de conexión");
    }
    setGeneratingLink(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      alert(
        "No se encontró un usuario con ese email. Debe registrarse primero."
      );
      setLoading(false);
      return;
    }

    // Check if already member
    const exists = members.find((m: any) => m.user_id === profile.id);
    if (exists) {
      alert("Ya es miembro del viaje");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("trip_members").insert({
      trip_id: tripId,
      user_id: profile.id,
      role: "member",
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setEmail("");
      refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <form
          onSubmit={handleInvite}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 flex gap-3"
        >
          <input
            type="email"
            required
            placeholder="Email del amigo a agregar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-medium transition whitespace-nowrap"
          >
            {loading ? "..." : "Agregar"}
          </button>
        </form>
      )}

      {/* Invite Link */}
      {isOwner && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Compartí este link para que se sumen
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Cualquiera con el link puede unirse al viaje
              </p>
            </div>
            <button
              onClick={handleGenerateInvite}
              disabled={generatingLink}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {generatingLink ? "..." : "Generar Link"}
            </button>
          </div>
          {inviteLink && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-sm text-gray-700 dark:text-slate-200"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("¡Link copiado!");
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {members.map((m: TripMember) => (
          <div
            key={m.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                {(
                  m.profiles?.display_name?.[0] ||
                  m.profiles?.email?.[0] ||
                  "?"
                ).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {m.profiles?.display_name || m.profiles?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{m.profiles?.email}</p>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full ${
                m.role === "owner"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
              }`}
            >
              {m.role === "owner" ? "Organizador" : "Miembro"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ ACCOMMODATIONS TAB ============
function AccommodationsTab({
  accommodations,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    url: "",
    name: "",
    price_per_night: "",
    currency: "USD" as CurrencyType,
  });
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("accommodations").insert({
      trip_id: tripId,
      url: form.url,
      name: form.name || null,
      platform: form.url.includes("airbnb") ? "airbnb" : "manual",
      price_per_night: form.price_per_night
        ? parseFloat(form.price_per_night)
        : null,
      currency: form.currency,
      created_by: currentUserId,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({ url: "", name: "", price_per_night: "", currency: "USD" });
      setShowForm(false);
      refresh();
    }
    setLoading(false);
  }

  async function handleScrape(accId: string, url: string) {
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accommodationId: accId, url }),
      });
      const data = await res.json();
      if (data.error) alert("Error scrapeando: " + data.error);
      else refresh();
    } catch {
      alert("Error de conexión");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
        >
          + Agregar alojamiento
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-800 dark:text-slate-100">Nuevo Alojamiento</h3>
          <input
            type="url"
            required
            placeholder="Link de Airbnb, Booking, etc."
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <input
            type="text"
            placeholder="Nombre (opcional - se intenta obtener del link)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Precio por noche"
              value={form.price_per_night}
              onChange={(e) =>
                setForm({ ...form, price_per_night: e.target.value })
              }
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <select
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value as CurrencyType })
              }
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {accommodations.map((acc: Accommodation) => (
          <div
            key={acc.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {acc.name || "Alojamiento sin nombre"}
                </h4>
                {acc.location && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    📍 {acc.location}
                  </p>
                )}
                <a
                  href={acc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline dark:hover:text-blue-300 mt-1 inline-block"
                >
                  Ver en {acc.platform}
                </a>
              </div>
              <div className="text-right">
                {acc.price_per_night && (
                  <p className="font-bold text-gray-900 dark:text-white">
                    {acc.price_per_night.toLocaleString("es-AR")} {acc.currency}
                    <span className="text-sm font-normal text-gray-500 dark:text-slate-400">
                      /noche
                    </span>
                  </p>
                )}
                {acc.rating && (
                  <p className="text-sm text-yellow-600">⭐ {acc.rating}</p>
                )}
              </div>
            </div>
            {acc.url.includes("airbnb") && (
              <button
                onClick={() => handleScrape(acc.id, acc.url)}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
              >
                🔄 Actualizar precio desde Airbnb
              </button>
            )}
            {acc.last_scraped_at && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                Última actualización:{" "}
                {new Date(acc.last_scraped_at).toLocaleString("es-AR")}
              </p>
            )}
          </div>
        ))}
        {accommodations.length === 0 && (
          <p className="text-center text-gray-400 dark:text-slate-500 py-8">
            No hay alojamientos cargados
          </p>
        )}
      </div>
    </div>
  );
}

// ============ FLIGHTS TAB ============
function FlightsTab({
  flights,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    origin: "EZE",
    destination: "BRC",
    date_from: "",
    date_to: "",
    max_price: "",
    currency: "ARS" as CurrencyType,
    alert_email: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("flights_watchlist").insert({
      trip_id: tripId,
      origin: form.origin.toUpperCase(),
      destination: form.destination.toUpperCase(),
      date_from: form.date_from,
      date_to: form.date_to || null,
      max_price: form.max_price ? parseFloat(form.max_price) : null,
      currency: form.currency,
      alert_email: form.alert_email || null,
      created_by: currentUserId,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setShowForm(false);
      refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
        >
          + Agregar alerta de vuelo
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-800 dark:text-slate-100">
            Nueva Alerta de Vuelo
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Origen (IATA)
              </label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="EZE"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Destino (IATA)
              </label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="BRC"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 uppercase"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Fecha ida
              </label>
              <input
                type="date"
                required
                value={form.date_from}
                onChange={(e) =>
                  setForm({ ...form, date_from: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Fecha vuelta
              </label>
              <input
                type="date"
                value={form.date_to}
                onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Precio máximo (alertar si baja)"
              value={form.max_price}
              onChange={(e) => setForm({ ...form, max_price: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <select
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value as CurrencyType })
              }
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <input
            type="email"
            placeholder="Email para alertas (opcional)"
            value={form.alert_email}
            onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition"
            >
              {loading ? "Guardando..." : "Crear Alerta"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {flights.map((f: FlightWatch) => (
          <div
            key={f.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {f.origin} → {f.destination}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  📅 {new Date(f.date_from).toLocaleDateString("es-AR")}
                  {f.date_to &&
                    ` — ${new Date(f.date_to).toLocaleDateString("es-AR")}`}
                </p>
                {f.max_price && (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Alerta si baja de {f.max_price} {f.currency}
                  </p>
                )}
              </div>
              <div className="text-right">
                {f.last_price ? (
                  <>
                    <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                      {f.last_price.toLocaleString("es-AR")} {f.currency}
                    </p>
                    {f.lowest_price && f.lowest_price < f.last_price && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Mínimo: {f.lowest_price.toLocaleString("es-AR")}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-slate-500">
                    Pendiente de chequeo
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  f.is_active
                    ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                }`}
              >
                {f.is_active ? "Activa" : "Pausada"}
              </span>
              {f.last_checked_at && (
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Chequeado:{" "}
                  {new Date(f.last_checked_at).toLocaleString("es-AR")}
                </span>
              )}
            </div>
          </div>
        ))}
        {flights.length === 0 && (
          <p className="text-center text-gray-400 dark:text-slate-500 py-8">
            No hay alertas de vuelo configuradas
          </p>
        )}
      </div>
    </div>
  );
}

// ============ CHECKLIST TAB ============
function ChecklistTab({
  checklist,
  members,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: any) {
  const [text, setText] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    await supabase.from("checklist_items").insert({
      trip_id: tripId,
      text: text.trim(),
      assigned_to: assignedTo || null,
      created_by: currentUserId,
    });

    setText("");
    setAssignedTo("");
    refresh();
  }

  async function toggleItem(id: string, isDone: boolean) {
    await supabase
      .from("checklist_items")
      .update({ is_done: !isDone })
      .eq("id", id);
    refresh();
  }

  const done = checklist.filter((i: ChecklistItem) => i.is_done);
  const pending = checklist.filter((i: ChecklistItem) => !i.is_done);

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex gap-3"
      >
        <input
          type="text"
          placeholder="Agregar item (ej: cadenas para el auto)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-sm text-gray-700"
        >
          <option value="">Sin asignar</option>
          {members.map((m: TripMember) => (
            <option key={m.user_id} value={m.user_id}>
              {m.profiles?.display_name || m.profiles?.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          +
        </button>
      </form>

      {/* Pending */}
      <div className="space-y-2">
        {pending.map((item: ChecklistItem) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-3 flex items-center gap-3"
          >
            <button
              onClick={() => toggleItem(item.id, item.is_done)}
              className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-500 hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-center transition flex-shrink-0"
            />
            <span className="flex-1 text-gray-800 dark:text-slate-200">{item.text}</span>
            {item.profiles && (
              <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-full">
                {(item as any).profiles?.display_name ||
                  (item as any).profiles?.email}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
            Completados ({done.length})
          </p>
          <div className="space-y-2">
            {done.map((item: ChecklistItem) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleItem(item.id, item.is_done)}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-xs">✓</span>
                </button>
                <span className="flex-1 text-gray-400 dark:text-slate-500 line-through">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {checklist.length === 0 && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-8">
          Checklist vacío — agregá items arriba
        </p>
      )}
    </div>
  );
}

// ============ PREVIEW TAB ============
function PreviewTab({
  options,
  members,
}: {
  options: TripOption[];
  members: TripMember[];
}) {
  const memberCount = members.length || 1;

  // Local state: which options are ticked (starts with is_selected ones)
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(options.filter((o) => o.is_selected).map((o) => o.id))
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const CATS: { value: OptionCategory; label: string; icon: string }[] = [
    { value: "alojamiento", label: "Alojamiento", icon: "🏠" },
    { value: "transporte_ida", label: "Transporte (ida)", icon: "✈️" },
    { value: "transporte_vuelta", label: "Transporte (vuelta)", icon: "🔙" },
    { value: "skipass", label: "Ski Pass", icon: "🎫" },
    { value: "equipamiento", label: "Equipamiento", icon: "🎿" },
    { value: "comida", label: "Comida", icon: "🍕" },
    { value: "actividades", label: "Actividades", icon: "⛷️" },
    { value: "otros", label: "Otros", icon: "📦" },
  ];

  // Group by category
  const byCategory = new Map<OptionCategory, TripOption[]>();
  for (const opt of options) {
    const list = byCategory.get(opt.category) || [];
    list.push(opt);
    byCategory.set(opt.category, list);
  }

  const checkedOptions = options.filter((o) => checked.has(o.id));

  function costPerPerson(opt: TripOption): number {
    if (!opt.price) return 0;
    return opt.is_per_person ? opt.price : opt.price / memberCount;
  }

  const totalPerPerson = checkedOptions.reduce((s, o) => s + costPerPerson(o), 0);
  const totalGlobal = checkedOptions.reduce((s, o) => s + (o.price || 0), 0);

  // Group totals by currency
  const byCurrency = new Map<string, { total: number; perPerson: number }>();
  for (const opt of checkedOptions) {
    if (!opt.price) continue;
    const curr = opt.currency || "ARS";
    const existing = byCurrency.get(curr) || { total: 0, perPerson: 0 };
    existing.total += opt.price;
    existing.perPerson += costPerPerson(opt);
    byCurrency.set(curr, existing);
  }

  return (
    <div className="space-y-4">
      {/* Sticky total */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white sticky top-20 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Preview del Viaje</h3>
          <span className="text-sm text-purple-200">
            {checkedOptions.length} items seleccionados
          </span>
        </div>

        {byCurrency.size > 0 ? (
          <div className="space-y-2">
            {Array.from(byCurrency.entries()).map(([currency, vals]) => (
              <div key={currency} className="flex justify-between items-end">
                <div>
                  <p className="text-purple-200 text-xs">Total en {currency}</p>
                  <p className="text-xl font-bold">
                    ${vals.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-purple-200 text-xs">Por persona</p>
                  <p className="text-xl font-bold">
                    ${vals.perPerson.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-purple-200">Tildá opciones abajo para ver el total</p>
        )}
      </div>

      {/* Options by category with checkboxes */}
      {CATS.map((cat) => {
        const catOptions = byCategory.get(cat.value);
        if (!catOptions || catOptions.length === 0) return null;

        return (
          <div key={cat.value}>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              {cat.icon} {cat.label}
            </h4>
            <div className="space-y-2">
              {catOptions.map((opt) => {
                const isChecked = checked.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition ${
                      isChecked
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                        : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                          isChecked
                            ? "bg-purple-600 border-purple-600"
                            : "border-gray-300 dark:border-slate-500"
                        }`}
                      >
                        {isChecked && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{opt.name}</p>
                        {opt.description && (
                          <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                            {opt.description}
                          </p>
                        )}
                        {opt.notes && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 italic mt-0.5">
                            {opt.notes}
                          </p>
                        )}
                        {opt.url && (
                          <span className="text-xs text-blue-500 dark:text-blue-400">Link disponible</span>
                        )}
                      </div>

                      {opt.price !== null && opt.price !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 dark:text-white">
                            ${opt.price.toLocaleString("es-AR")}
                            <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                              {opt.currency}
                            </span>
                          </p>
                          {!opt.is_per_person && memberCount > 1 && (
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                              ${costPerPerson(opt).toLocaleString("es-AR", {
                                minimumFractionDigits: 0,
                              })}
                              /persona
                            </p>
                          )}
                          {opt.is_per_person && (
                            <p className="text-xs text-gray-500 dark:text-slate-400">c/u</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vote indicator */}
                    {(opt.votes || []).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center gap-1">
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          👍 {opt.votes.length} voto{opt.votes.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {options.length === 0 && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-8">
          No hay opciones cargadas — agregalas en la pestaña &quot;Armar Combo&quot;
        </p>
      )}

      {/* Detailed breakdown */}
      {checkedOptions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h4 className="font-semibold text-gray-800 dark:text-slate-100 mb-4">Detalle del combo</h4>
          <div className="space-y-2">
            {checkedOptions.map((opt) => (
              <div key={opt.id} className="flex justify-between py-1.5 border-b border-gray-100 dark:border-slate-700 last:border-0">
                <div>
                  <span className="text-sm text-gray-400 dark:text-slate-500 mr-2">
                    {CATS.find((c) => c.value === opt.category)?.icon}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-slate-200">{opt.name}</span>
                </div>
                <div className="text-right text-sm">
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${(opt.price || 0).toLocaleString("es-AR")} {opt.currency}
                  </span>
                  {!opt.is_per_person && memberCount > 1 && (
                    <span className="text-gray-400 dark:text-slate-500 ml-2">
                      (${costPerPerson(opt).toLocaleString("es-AR", { minimumFractionDigits: 0 })}/pp)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t-2 border-gray-200 dark:border-slate-700">
            {Array.from(byCurrency.entries()).map(([currency, vals]) => (
              <div key={currency} className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                <span>Total {currency}</span>
                <span>
                  ${vals.total.toLocaleString("es-AR")} → ${vals.perPerson.toLocaleString("es-AR", { minimumFractionDigits: 0 })}/persona
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
