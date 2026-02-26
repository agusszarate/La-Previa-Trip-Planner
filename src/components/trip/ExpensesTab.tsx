"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, TripMember, Debt, ExpenseCategory, CurrencyType } from "@/lib/types";
import { CATEGORIES, CURRENCIES } from "./constants";

interface Props {
  expenses: Expense[];
  members: TripMember[];
  debts: Debt[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
}

export default function ExpensesTab({
  expenses,
  members,
  debts,
  tripId,
  currentUserId,
  supabase,
  refresh,
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

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Ingresá un monto válido");
      setLoading(false);
      return;
    }

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

    if (form.split_type === "equal") {
      const splitAmount = amount / members.length;
      const splits = members.map((m) => ({
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
      category: "other",
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
            {debts.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-4 py-2.5"
              >
                <span className="text-sm text-gray-700 dark:text-slate-200">
                  <strong>{d.from_name}</strong> le debe a <strong>{d.to_name}</strong>
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
              {members.map((m) => (
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
        {expenses.map((exp) => (
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
            {exp.expense_splits && exp.expense_splits.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">División:</p>
                <div className="flex flex-wrap gap-2">
                  {exp.expense_splits.map((split) => {
                    const member = members.find(
                      (m) => m.user_id === split.user_id
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
            <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3">
              <button
                onClick={async () => {
                  if (!confirm("¿Eliminar este gasto?")) return;
                  await supabase.from("expense_splits").delete().eq("expense_id", exp.id);
                  await supabase.from("expenses").delete().eq("id", exp.id);
                  refresh();
                }}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                Eliminar
              </button>
            </div>
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
            {debts.map((d, i) => (
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
                      const relatedExpenses = expenses.filter(
                        (e) => e.paid_by === d.to
                      );
                      for (const exp of relatedExpenses) {
                        if (!exp.expense_splits) continue;
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
