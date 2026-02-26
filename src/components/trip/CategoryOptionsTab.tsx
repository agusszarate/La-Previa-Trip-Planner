"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripOption, TripMember, OptionCategory, CurrencyType } from "@/lib/types";
import type { ExchangeRates } from "@/lib/exchange-rates";
import { CURRENCIES } from "./constants";
import OptionCard from "./OptionCard";

interface Props {
  options: TripOption[];
  members: TripMember[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
  category: OptionCategory;
  categoryLabel: string;
  exchangeRates?: ExchangeRates | null;
}

export default function CategoryOptionsTab({
  options,
  members,
  tripId,
  currentUserId,
  supabase,
  refresh,
  category,
  categoryLabel,
  exchangeRates,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    url: "",
    price: "",
    currency: "ARS" as CurrencyType,
    is_per_person: false,
    notes: "",
  });

  const memberCount = members.length || 1;
  const categoryOptions = options.filter((o) => o.category === category);

  function getOptionCostPerPerson(opt: TripOption): number {
    if (!opt.price) return 0;
    if (opt.is_per_person) return opt.price;
    return opt.price / memberCount;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const price = form.price ? parseFloat(form.price) : null;

    const { error } = await supabase.from("trip_options").insert({
      trip_id: tripId,
      category,
      name: form.name,
      description: form.description || null,
      url: form.url || null,
      price,
      currency: form.currency,
      price_per_person: price && !form.is_per_person ? Math.round((price / memberCount) * 100) / 100 : price,
      is_per_person: form.is_per_person,
      notes: form.notes || null,
      created_by: currentUserId,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setForm({
        name: "",
        description: "",
        url: "",
        price: "",
        currency: "ARS",
        is_per_person: false,
        notes: "",
      });
      setShowForm(false);
      refresh();
    }
    setLoading(false);
  }

  async function handleSelect(optionId: string) {
    // Deselect all in this category first
    for (const opt of categoryOptions) {
      if (opt.is_selected) {
        await supabase
          .from("trip_options")
          .update({ is_selected: false })
          .eq("id", opt.id);
      }
    }
    // Select this one
    await supabase
      .from("trip_options")
      .update({ is_selected: true })
      .eq("id", optionId);
    refresh();
  }

  async function handleVote(optionId: string, currentVotes: string[]) {
    const hasVoted = currentVotes.includes(currentUserId);
    const newVotes = hasVoted
      ? currentVotes.filter((v) => v !== currentUserId)
      : [...currentVotes, currentUserId];

    await supabase
      .from("trip_options")
      .update({ votes: newVotes })
      .eq("id", optionId);
    refresh();
  }

  async function handleDelete(optionId: string) {
    if (!confirm("¿Eliminar esta opción?")) return;
    await supabase.from("trip_options").delete().eq("id", optionId);
    refresh();
  }

  return (
    <div className="space-y-4">
      {/* Add Button / Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="cursor-pointer w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
        >
          + Agregar opción de {categoryLabel.toLowerCase()}
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-800 dark:text-slate-100">
            Nueva opción — {categoryLabel}
          </h3>

          <input
            type="text"
            required
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <input
            type="url"
            placeholder="Link (opcional)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as CurrencyType })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.is_per_person}
              onChange={(e) => setForm({ ...form, is_per_person: e.target.checked })}
              className="rounded"
            />
            El precio ya es por persona
          </label>

          <textarea
            placeholder="Notas (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition"
            >
              {loading ? "Guardando..." : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="cursor-pointer px-4 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Options List */}
      <div className="space-y-3">
        {categoryOptions.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            memberCount={memberCount}
            currentUserId={currentUserId}
            members={members}
            onSelect={() => handleSelect(opt.id)}
            onVote={() => handleVote(opt.id, opt.votes || [])}
            onDelete={() => handleDelete(opt.id)}
            getOptionCostPerPerson={getOptionCostPerPerson}
            exchangeRates={exchangeRates}
          />
        ))}
        {categoryOptions.length === 0 && !showForm && (
          <p className="text-center text-gray-400 dark:text-slate-500 py-8">
            No hay opciones de {categoryLabel.toLowerCase()} todavía
          </p>
        )}
      </div>
    </div>
  );
}
