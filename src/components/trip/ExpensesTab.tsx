"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, TripMember, Debt, ExpenseCategory, CurrencyType, ExpensePayer } from "@/lib/types";
import { convertToARS, type ExchangeRates } from "@/lib/exchange-rates";
import { CATEGORIES, CURRENCIES } from "./constants";

interface Props {
  expenses: Expense[];
  members: TripMember[];
  debts: Debt[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
  exchangeRates?: ExchangeRates | null;
}

export default function ExpensesTab({
  expenses,
  members,
  debts,
  tripId,
  currentUserId,
  supabase,
  refresh,
  exchangeRates,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "ARS" as CurrencyType,
    category: "other" as ExpenseCategory,
    paid_by: currentUserId,
    split_type: "equal",
  });
  const [loading, setLoading] = useState(false);

  // Selective split: which members to split between
  const [splitAll, setSplitAll] = useState(true);
  const [splitMemberIds, setSplitMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id))
  );

  // Multi-payer
  const [multiPayer, setMultiPayer] = useState(false);
  const [payers, setPayers] = useState<{ user_id: string; amount: string }[]>([
    { user_id: currentUserId, amount: "" },
  ]);

  function resetForm() {
    setForm({
      description: "",
      amount: "",
      currency: "ARS",
      category: "other",
      paid_by: currentUserId,
      split_type: "equal",
    });
    setSplitAll(true);
    setSplitMemberIds(new Set(members.map((m) => m.user_id)));
    setMultiPayer(false);
    setPayers([{ user_id: currentUserId, amount: "" }]);
  }

  function formatDebtAmount(amount: number, currency: CurrencyType): string {
    const formatted = amount.toLocaleString("es-AR", { minimumFractionDigits: 2 });
    if (currency === "ARS" || !exchangeRates) return `${formatted} ${currency}`;
    const arsAmount = convertToARS(amount, currency, exchangeRates);
    if (arsAmount === null) return `${formatted} ${currency}`;
    const arsFormatted = arsAmount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${formatted} ${currency} (~$${arsFormatted} ARS)`;
  }

  function toggleSplitMember(userId: string) {
    const next = new Set(splitMemberIds);
    if (next.has(userId)) {
      if (next.size <= 1) return; // At least 1 member
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSplitMemberIds(next);
  }

  function addPayer() {
    const availableMembers = members.filter(
      (m) => !payers.some((p) => p.user_id === m.user_id)
    );
    if (availableMembers.length === 0) return;
    setPayers([...payers, { user_id: availableMembers[0].user_id, amount: "" }]);
  }

  function removePayer(index: number) {
    if (payers.length <= 1) return;
    setPayers(payers.filter((_, i) => i !== index));
  }

  function updatePayer(index: number, field: "user_id" | "amount", value: string) {
    const next = [...payers];
    next[index] = { ...next[index], [field]: value };
    setPayers(next);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Ingresá un monto válido");
      setLoading(false);
      return;
    }

    // Determine split members
    const targetMembers = splitAll
      ? members
      : members.filter((m) => splitMemberIds.has(m.user_id));

    if (targetMembers.length === 0) {
      alert("Seleccioná al menos un miembro para dividir");
      setLoading(false);
      return;
    }

    // Validate multi-payer amounts
    let payersData: ExpensePayer[] | null = null;
    let primaryPayer = form.paid_by;

    if (multiPayer) {
      const parsedPayers = payers.map((p) => ({
        user_id: p.user_id,
        amount: parseFloat(p.amount),
      }));

      const invalidPayer = parsedPayers.find((p) => isNaN(p.amount) || p.amount < 0);
      if (invalidPayer) {
        alert("Ingresá montos válidos para cada pagador");
        setLoading(false);
        return;
      }

      const payerTotal = parsedPayers.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(payerTotal - amount) > 0.01) {
        alert(`La suma de los pagadores (${payerTotal.toFixed(2)}) no coincide con el monto total (${amount.toFixed(2)})`);
        setLoading(false);
        return;
      }

      payersData = parsedPayers.filter((p) => p.amount > 0);
      primaryPayer = payersData[0]?.user_id || form.paid_by;
    }

    // Determine payer IDs (for auto-settling splits)
    const payerIds = new Set(
      payersData
        ? payersData.map((p) => p.user_id)
        : [primaryPayer]
    );

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        description: form.description,
        amount,
        currency: form.currency,
        category: form.category,
        paid_by: primaryPayer,
        payers: payersData,
        split_type: form.split_type,
      })
      .select()
      .single();

    if (error || !expense) {
      alert("Error: " + error?.message);
      setLoading(false);
      return;
    }

    if (form.split_type === "equal") {
      const splitAmount = amount / targetMembers.length;
      const splits = targetMembers.map((m) => ({
        expense_id: expense.id,
        user_id: m.user_id,
        amount: Math.round(splitAmount * 100) / 100,
        is_settled: payerIds.has(m.user_id),
        settled_at: payerIds.has(m.user_id) ? new Date().toISOString() : null,
      }));

      await supabase.from("expense_splits").insert(splits);
    }

    resetForm();
    setShowForm(false);
    setLoading(false);
    refresh();
  }

  /** Get display name for a payer, handling multi-payer */
  function getPaidByLabel(exp: Expense): string {
    if (exp.payers && exp.payers.length > 1) {
      return exp.payers
        .map((p) => {
          const m = members.find((m) => m.user_id === p.user_id);
          return m?.profiles?.display_name || m?.profiles?.email || "?";
        })
        .join(", ");
    }
    return (exp as any).profiles?.display_name || (exp as any).profiles?.email || "?";
  }

  const inputClass = "px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900";

  return (
    <div className="space-y-4">
      {/* Debts Summary */}
      {debts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-3">
            Quién le debe a quién
          </h3>
          <div className="space-y-2">
            {debts.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200">
                  <strong>{d.from_name}</strong> le debe a <strong>{d.to_name}</strong>
                </span>
                <span className="font-semibold text-orange-700 dark:text-orange-400">
                  {formatDebtAmount(d.amount, d.currency)}
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
          className="cursor-pointer w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
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
            className={`w-full ${inputClass}`}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              required
              step="0.01"
              placeholder="Monto"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={inputClass}
            />
            <select
              value={form.currency}
              onChange={(e) =>
                setForm({ ...form, currency: e.target.value as CurrencyType })
              }
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as ExpenseCategory })
            }
            className={`w-full ${inputClass}`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Payer section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                ¿Quién pagó?
              </label>
              <button
                type="button"
                onClick={() => {
                  setMultiPayer(!multiPayer);
                  if (!multiPayer) {
                    setPayers([{ user_id: form.paid_by, amount: form.amount }]);
                  }
                }}
                className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {multiPayer ? "Una persona" : "Varias personas"}
              </button>
            </div>

            {!multiPayer ? (
              <select
                value={form.paid_by}
                onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
                className={`w-full ${inputClass}`}
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.display_name || m.profiles?.email}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                {payers.map((payer, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={payer.user_id}
                      onChange={(e) => updatePayer(idx, "user_id", e.target.value)}
                      className={`flex-1 ${inputClass}`}
                    >
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.profiles?.display_name || m.profiles?.email}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto"
                      value={payer.amount}
                      onChange={(e) => updatePayer(idx, "amount", e.target.value)}
                      className={`w-28 ${inputClass}`}
                    />
                    {payers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayer(idx)}
                        className="cursor-pointer text-red-500 hover:text-red-700 text-sm px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {payers.length < members.length && (
                  <button
                    type="button"
                    onClick={addPayer}
                    className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    + Agregar pagador
                  </button>
                )}
                {form.amount && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Suma: {payers.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0).toFixed(2)} / {parseFloat(form.amount || "0").toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Split between section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Dividir entre
              </label>
              <button
                type="button"
                onClick={() => {
                  if (splitAll) {
                    setSplitAll(false);
                  } else {
                    setSplitAll(true);
                    setSplitMemberIds(new Set(members.map((m) => m.user_id)));
                  }
                }}
                className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {splitAll ? "Elegir miembros" : "Todos"}
              </button>
            </div>

            {splitAll ? (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Todos los miembros ({members.length})
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = splitMemberIds.has(m.user_id);
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => toggleSplitMember(m.user_id)}
                      className={`cursor-pointer text-sm px-3 py-1.5 rounded-full border transition ${
                        selected
                          ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400"
                      }`}
                    >
                      {m.profiles?.display_name || m.profiles?.email}
                      {selected ? " ✓" : ""}
                    </button>
                  );
                })}
                <p className="w-full text-xs text-gray-500 dark:text-slate-400">
                  {splitMemberIds.size} de {members.length} · ${form.amount
                    ? (parseFloat(form.amount) / splitMemberIds.size).toFixed(2)
                    : "0.00"} c/u
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="cursor-pointer px-4 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Expense List */}
      <div className="space-y-3">
        {expenses.map((exp) => {
          const payerIds = new Set(
            exp.payers && exp.payers.length > 0
              ? exp.payers.map((p) => p.user_id)
              : [exp.paid_by]
          );
          return (
            <div
              key={exp.id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {CATEGORIES.find((c) => c.value === exp.category)?.label}{" "}
                    · Pagó {getPaidByLabel(exp)}
                  </p>
                  {exp.payers && exp.payers.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {exp.payers.map((p) => {
                        const m = members.find((m) => m.user_id === p.user_id);
                        return (
                          <span
                            key={p.user_id}
                            className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          >
                            {m?.profiles?.display_name || m?.profiles?.email || "?"}: {p.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {exp.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{exp.currency}</p>
                </div>
              </div>
              {exp.expense_splits && exp.expense_splits.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                    División ({exp.expense_splits.length} {exp.expense_splits.length === members.length ? "" : `de ${members.length}`}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exp.expense_splits.map((split) => {
                      const member = members.find((m) => m.user_id === split.user_id);
                      const isSettled = split.is_settled || payerIds.has(split.user_id);
                      return (
                        <span
                          key={split.id}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isSettled
                              ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                          }`}
                        >
                          {member?.profiles?.display_name || member?.profiles?.email || "?"}{" "}
                          {split.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          {isSettled ? " ✓" : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar este gasto?")) return;
                    await supabase.from("expense_splits").delete().eq("expense_id", exp.id);
                    await supabase.from("expenses").delete().eq("id", exp.id);
                    refresh();
                  }}
                  className="cursor-pointer text-xs text-red-500 hover:text-red-700 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
        {expenses.length === 0 && (
          <p className="text-center text-gray-400 dark:text-slate-500 py-8">
            No hay gastos todavía
          </p>
        )}
      </div>

      {/* Settle Debts */}
      {debts.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
            Marcar como pagado
          </h3>
          <div className="space-y-2">
            {debts.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200">
                  <strong>{d.from_name}</strong> → <strong>{d.to_name}</strong>:{" "}
                  {formatDebtAmount(d.amount, d.currency)}
                </span>
                {(d.from === currentUserId || d.to === currentUserId) && (
                  <button
                    onClick={async () => {
                      // Find expenses where d.to is a payer
                      for (const exp of expenses) {
                        if (!exp.expense_splits) continue;
                        const expPayerIds = exp.payers && exp.payers.length > 0
                          ? exp.payers.map((p) => p.user_id)
                          : [exp.paid_by];
                        if (!expPayerIds.includes(d.to)) continue;

                        const split = exp.expense_splits.find(
                          (s) => s.user_id === d.from && !s.is_settled
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
                    className="cursor-pointer text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
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
