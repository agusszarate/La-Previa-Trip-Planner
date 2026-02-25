"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TripOption, OptionCategory, TripMember } from "@/lib/types";

const OPTION_CATEGORIES: { value: OptionCategory; label: string; icon: string }[] = [
  { value: "alojamiento", label: "Alojamiento", icon: "🏠" },
  { value: "transporte_ida", label: "Transporte (ida)", icon: "✈️" },
  { value: "transporte_vuelta", label: "Transporte (vuelta)", icon: "🔙" },
  { value: "skipass", label: "Ski Pass", icon: "🎫" },
  { value: "equipamiento", label: "Equipamiento", icon: "🎿" },
  { value: "comida", label: "Comida", icon: "🍕" },
  { value: "actividades", label: "Actividades", icon: "⛷️" },
  { value: "otros", label: "Otros", icon: "📦" },
];

interface Props {
  options: TripOption[];
  members: TripMember[];
  tripId: string;
  currentUserId: string;
  supabase: any;
}

export default function ComboBuilder({
  options,
  members,
  tripId,
  currentUserId,
  supabase,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<OptionCategory | "resumen">("resumen");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: "alojamiento" as OptionCategory,
    name: "",
    description: "",
    url: "",
    price: "",
    currency: "ARS",
    is_per_person: false,
    notes: "",
  });

  const memberCount = members.length || 1;

  function refresh() {
    router.refresh();
  }

  // Group options by category
  const byCategory = new Map<OptionCategory, TripOption[]>();
  for (const opt of options) {
    const list = byCategory.get(opt.category) || [];
    list.push(opt);
    byCategory.set(opt.category, list);
  }

  // Get selected options (one per category)
  const selectedOptions = options.filter((o) => o.is_selected);

  // Calculate combo total
  function getOptionCostPerPerson(opt: TripOption): number {
    if (!opt.price) return 0;
    if (opt.is_per_person) return opt.price;
    return opt.price / memberCount;
  }

  const comboTotalPerPerson = selectedOptions.reduce(
    (sum, opt) => sum + getOptionCostPerPerson(opt),
    0
  );

  const comboTotalGlobal = selectedOptions.reduce(
    (sum, opt) => sum + (opt.price || 0),
    0
  );

  async function handleAddOption(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const price = form.price ? parseFloat(form.price) : null;

    await supabase.from("trip_options").insert({
      trip_id: tripId,
      category: form.category,
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

    setForm({
      category: form.category,
      name: "",
      description: "",
      url: "",
      price: "",
      currency: "ARS",
      is_per_person: false,
      notes: "",
    });
    setShowForm(false);
    setLoading(false);
    refresh();
  }

  async function handleSelect(optionId: string, category: OptionCategory) {
    // Deselect all in this category first
    const categoryOptions = byCategory.get(category) || [];
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
      {/* Combo Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <h3 className="font-bold text-lg mb-1">Tu Combo</h3>
        <p className="text-blue-100 text-sm mb-4">
          {selectedOptions.length} de {OPTION_CATEGORIES.length} categorías elegidas
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-blue-200 text-xs">Total del viaje</p>
            <p className="text-2xl font-bold">
              ${comboTotalGlobal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Por persona ({memberCount})</p>
            <p className="text-2xl font-bold">
              ${comboTotalPerPerson.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        {selectedOptions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 space-y-1">
            {selectedOptions.map((opt) => (
              <div key={opt.id} className="flex justify-between text-sm">
                <span className="text-blue-100">
                  {OPTION_CATEGORIES.find((c) => c.value === opt.category)?.icon}{" "}
                  {opt.name}
                </span>
                <span className="font-medium">
                  ${getOptionCostPerPerson(opt).toLocaleString("es-AR", { minimumFractionDigits: 0 })}/persona
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-1">
        <button
          onClick={() => setActiveCategory("resumen")}
          className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            activeCategory === "resumen"
              ? "bg-blue-600 text-white"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          }`}
        >
          📊 Todo
        </button>
        {OPTION_CATEGORIES.map((cat) => {
          const catOptions = byCategory.get(cat.value) || [];
          const hasSelected = catOptions.some((o) => o.is_selected);
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1 ${
                activeCategory === cat.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {cat.icon} {cat.label}
              {hasSelected && (
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              )}
              {catOptions.length > 0 && (
                <span className="text-xs opacity-60">({catOptions.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add Option Button */}
      {!showForm ? (
        <button
          onClick={() => {
            if (activeCategory !== "resumen") {
              setForm({ ...form, category: activeCategory });
            }
            setShowForm(true);
          }}
          className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition"
        >
          + Agregar opción
        </button>
      ) : (
        <form
          onSubmit={handleAddOption}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-800 dark:text-slate-100">Nueva Opción</h3>

          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as OptionCategory })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          >
            {OPTION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            required
            placeholder="Nombre (ej: Cabaña en el bosque, Vuelo Aerolíneas...)"
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
            placeholder="Link (Airbnb, Booking, aerolínea, etc.)"
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
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
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
            placeholder="Notas (ej: tiene pileta, incluye desayuno...)"
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
              className="px-4 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Options by Category */}
      {activeCategory === "resumen" ? (
        // Show all categories
        <div className="space-y-6">
          {OPTION_CATEGORIES.map((cat) => {
            const catOptions = byCategory.get(cat.value) || [];
            if (catOptions.length === 0) return null;
            return (
              <div key={cat.value}>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">
                  {cat.icon} {cat.label}
                </h4>
                <div className="space-y-2">
                  {catOptions.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      memberCount={memberCount}
                      currentUserId={currentUserId}
                      members={members}
                      onSelect={() => handleSelect(opt.id, opt.category)}
                      onVote={() => handleVote(opt.id, opt.votes || [])}
                      onDelete={() => handleDelete(opt.id)}
                      getOptionCostPerPerson={getOptionCostPerPerson}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {options.length === 0 && (
            <p className="text-center text-gray-400 dark:text-slate-500 py-8">
              No hay opciones todavía — agregá la primera arriba
            </p>
          )}
        </div>
      ) : (
        // Show single category
        <div className="space-y-2">
          {(byCategory.get(activeCategory) || []).map((opt) => (
            <OptionCard
              key={opt.id}
              option={opt}
              memberCount={memberCount}
              currentUserId={currentUserId}
              members={members}
              onSelect={() => handleSelect(opt.id, opt.category)}
              onVote={() => handleVote(opt.id, opt.votes || [])}
              onDelete={() => handleDelete(opt.id)}
              getOptionCostPerPerson={getOptionCostPerPerson}
            />
          ))}
          {(byCategory.get(activeCategory) || []).length === 0 && (
            <p className="text-center text-gray-400 dark:text-slate-500 py-8">
              No hay opciones en esta categoría
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============ OPTION CARD ============
function OptionCard({
  option,
  memberCount,
  currentUserId,
  members,
  onSelect,
  onVote,
  onDelete,
  getOptionCostPerPerson,
}: {
  option: TripOption;
  memberCount: number;
  currentUserId: string;
  members: TripMember[];
  onSelect: () => void;
  onVote: () => void;
  onDelete: () => void;
  getOptionCostPerPerson: (opt: TripOption) => number;
}) {
  const hasVoted = (option.votes || []).includes(currentUserId);
  const voteCount = (option.votes || []).length;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 p-4 transition ${
        option.is_selected
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-gray-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{option.name}</h4>
            {option.is_selected && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Elegido ✓
              </span>
            )}
          </div>
          {option.description && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{option.description}</p>
          )}
          {option.url && (
            <a
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
            >
              Ver link ↗
            </a>
          )}
          {option.notes && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">{option.notes}</p>
          )}
        </div>

        {option.price !== null && option.price !== undefined && (
          <div className="text-right ml-4">
            <p className="font-bold text-gray-900 dark:text-white">
              ${option.price.toLocaleString("es-AR")}
              <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                {option.currency}
              </span>
            </p>
            {!option.is_per_person && memberCount > 1 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ${getOptionCostPerPerson(option).toLocaleString("es-AR", { minimumFractionDigits: 0 })}/persona
              </p>
            )}
            {option.is_per_person && (
              <p className="text-xs text-gray-500 dark:text-slate-400">por persona</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3">
        <button
          onClick={onVote}
          className={`text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
            hasVoted
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400"
              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600"
          }`}
        >
          👍 {voteCount > 0 ? voteCount : ""}
          {hasVoted ? " Votado" : " Votar"}
        </button>

        {/* Show who voted */}
        {voteCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {(option.votes || [])
              .map((v) => {
                const m = members.find((m) => m.user_id === v);
                return m?.profiles?.display_name || m?.profiles?.email?.split("@")[0] || "?";
              })
              .join(", ")}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={onSelect}
          className={`text-sm px-3 py-1.5 rounded-lg transition ${
            option.is_selected
              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-400"
          }`}
        >
          {option.is_selected ? "✓ Elegido" : "Elegir"}
        </button>

        {option.created_by === currentUserId && (
          <button
            onClick={onDelete}
            className="text-xs text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
