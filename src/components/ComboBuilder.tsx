"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TripOption, OptionCategory, TripMember, SavedCombo, CurrencyType } from "@/lib/types";
import { convertToARS, type ExchangeRates } from "@/lib/exchange-rates";
import { OPTION_CATEGORIES } from "./trip/constants";
import OptionCard from "./trip/OptionCard";

interface Props {
  options: TripOption[];
  members: TripMember[];
  tripId: string;
  currentUserId: string;
  supabase: any;
  exchangeRates?: ExchangeRates | null;
}

export default function ComboBuilder({
  options,
  members,
  tripId,
  currentUserId,
  supabase,
  exchangeRates,
}: Props) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<OptionCategory | "summary">("summary");
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [comboName, setComboName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const memberCount = members.length || 1;

  function refresh() {
    router.refresh();
  }

  // Load saved combos
  useEffect(() => {
    supabase
      .from("saved_combos")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: SavedCombo[] | null }) => {
        if (data) setSavedCombos(data);
      });
  }, [tripId, supabase]);

  // Group options by category
  const byCategory = new Map<OptionCategory, TripOption[]>();
  for (const opt of options) {
    const list = byCategory.get(opt.category) || [];
    list.push(opt);
    byCategory.set(opt.category, list);
  }

  // Get selected options
  const selectedOptions = options.filter((o) => o.is_selected);

  function getOptionCostPerPerson(opt: TripOption): number {
    if (!opt.price) return 0;
    if (opt.is_per_person) return opt.price;
    return opt.price / memberCount;
  }

  /** Convert amount to ARS if exchange rates available, otherwise return raw */
  function toARS(amount: number, currency: string): number {
    if (currency === "ARS" || !exchangeRates) return amount;
    const converted = convertToARS(amount, currency as CurrencyType, exchangeRates);
    return converted ?? amount;
  }

  const hasMultipleCurrencies = new Set(selectedOptions.map((o) => o.currency)).size > 1;

  const comboTotalPerPerson = selectedOptions.reduce(
    (sum, opt) => sum + toARS(getOptionCostPerPerson(opt), opt.currency),
    0
  );

  const comboTotalGlobal = selectedOptions.reduce(
    (sum, opt) => sum + toARS(opt.price || 0, opt.currency),
    0
  );

  async function handleSelect(optionId: string, category: OptionCategory) {
    const categoryOptions = byCategory.get(category) || [];
    for (const opt of categoryOptions) {
      if (opt.is_selected) {
        await supabase
          .from("trip_options")
          .update({ is_selected: false })
          .eq("id", opt.id);
      }
    }
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

  async function handleSaveCombo() {
    if (!comboName.trim() || selectedOptions.length === 0) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("saved_combos")
      .insert({
        trip_id: tripId,
        name: comboName.trim(),
        option_ids: selectedOptions.map((o) => o.id),
        created_by: currentUserId,
      })
      .select()
      .single();

    if (!error && data) {
      setSavedCombos((prev) => [data, ...prev]);
      setComboName("");
      setShowSaveForm(false);
    }
    setSaving(false);
  }

  async function handleLoadCombo(combo: SavedCombo) {
    // Deselect all options
    for (const opt of options) {
      if (opt.is_selected) {
        await supabase
          .from("trip_options")
          .update({ is_selected: false })
          .eq("id", opt.id);
      }
    }
    // Select the ones in this combo
    for (const optId of combo.option_ids) {
      await supabase
        .from("trip_options")
        .update({ is_selected: true })
        .eq("id", optId);
    }
    refresh();
  }

  async function handleDeleteCombo(comboId: string) {
    await supabase.from("saved_combos").delete().eq("id", comboId);
    setSavedCombos((prev) => prev.filter((c) => c.id !== comboId));
  }

  return (
    <div className="space-y-4">
      {/* Combo Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg">Tu Combo</h3>
          {selectedOptions.length > 0 && (
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="cursor-pointer text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
            >
              Guardar combo
            </button>
          )}
        </div>
        <p className="text-blue-100 text-sm mb-4">
          {selectedOptions.length} de {OPTION_CATEGORIES.length} categorías elegidas
        </p>

        {/* Save combo form */}
        {showSaveForm && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Nombre del combo (ej: Opción económica)"
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/20 placeholder-blue-200 text-white border border-white/30 focus:border-white/60 outline-none text-sm"
            />
            <button
              onClick={handleSaveCombo}
              disabled={saving || !comboName.trim()}
              className="cursor-pointer px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition"
            >
              {saving ? "..." : "Guardar"}
            </button>
          </div>
        )}

        {/* Currency breakdown when multiple currencies */}
        {hasMultipleCurrencies && (() => {
          const byCurrency = new Map<string, { total: number; perPerson: number }>();
          for (const opt of selectedOptions) {
            const curr = opt.currency || "ARS";
            const existing = byCurrency.get(curr) || { total: 0, perPerson: 0 };
            existing.total += opt.price || 0;
            existing.perPerson += getOptionCostPerPerson(opt);
            byCurrency.set(curr, existing);
          }
          return (
            <div className="flex flex-wrap gap-3 mb-3">
              {Array.from(byCurrency.entries()).map(([currency, vals]) => (
                <div key={currency} className="bg-white/10 rounded-lg px-3 py-2 min-w-[120px]">
                  <p className="text-blue-200 text-xs font-medium">{currency}</p>
                  <p className="text-lg font-bold">
                    ${vals.total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-blue-200/80">
                    ${vals.perPerson.toLocaleString("es-AR", { minimumFractionDigits: 0 })}/persona
                  </p>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-blue-200 text-xs">
              {hasMultipleCurrencies && exchangeRates ? "Total en ARS" : "Total del viaje"}
            </p>
            <p className="text-2xl font-bold">
              ${comboTotalGlobal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              {hasMultipleCurrencies && exchangeRates && (
                <span className="text-sm font-normal text-blue-200 ml-1">ARS</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">
              {hasMultipleCurrencies && exchangeRates
                ? `Por persona (${memberCount}) en ARS`
                : `Por persona (${memberCount})`}
            </p>
            <p className="text-2xl font-bold">
              ${comboTotalPerPerson.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              {hasMultipleCurrencies && exchangeRates && (
                <span className="text-sm font-normal text-blue-200 ml-1">ARS</span>
              )}
            </p>
          </div>
        </div>
        {hasMultipleCurrencies && exchangeRates && (
          <p className="text-xs text-blue-200/70 mt-1">Convertido con cotización dólar blue</p>
        )}
        {selectedOptions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 space-y-1">
            {selectedOptions.map((opt) => {
              const perPerson = getOptionCostPerPerson(opt);
              const perPersonARS = toARS(perPerson, opt.currency);
              const showConversion = opt.currency !== "ARS" && exchangeRates;
              return (
                <div key={opt.id} className="flex justify-between text-sm gap-2">
                  <span className="text-blue-100">
                    {OPTION_CATEGORIES.find((c) => c.value === opt.category)?.icon}{" "}
                    {opt.name}
                  </span>
                  <span className="font-medium text-right shrink-0">
                    ${perPerson.toLocaleString("es-AR", { minimumFractionDigits: 0 })} {opt.currency}/pp
                    {showConversion && (
                      <span className="text-blue-200 text-xs block">
                        ~${perPersonARS.toLocaleString("es-AR", { maximumFractionDigits: 0 })} ARS
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved Combos */}
      {savedCombos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Combos guardados</h4>
          <div className="space-y-2">
            {savedCombos.map((combo) => {
              const isActive = combo.option_ids.length > 0 &&
                combo.option_ids.every((id) => selectedOptions.some((o) => o.id === id)) &&
                selectedOptions.length === combo.option_ids.length;
              return (
                <div
                  key={combo.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 border transition ${
                    isActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-gray-200 dark:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{combo.name}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">
                      {combo.option_ids.length} items
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadCombo(combo)}
                      className="cursor-pointer text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                    >
                      {isActive ? "Activo" : "Cargar"}
                    </button>
                    <button
                      onClick={() => handleDeleteCombo(combo.id)}
                      className="cursor-pointer text-xs text-red-500 hover:text-red-700 px-2 py-1.5 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-1">
        <button
          onClick={() => setActiveCategory("summary")}
          className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            activeCategory === "summary"
              ? "bg-blue-600 text-white"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          }`}
        >
          Todo
        </button>
        {OPTION_CATEGORIES.map((cat) => {
          const catOptions = byCategory.get(cat.value) || [];
          const hasSelected = catOptions.some((o) => o.is_selected);
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1 ${
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

      {/* Hint when empty */}
      {options.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Todavía no hay opciones. Agregá opciones desde los tabs de cada categoría (Alojamiento, Transporte, Entradas, etc.)
          </p>
        </div>
      )}

      {/* Options by Category */}
      {activeCategory === "summary" ? (
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
                      showDelete={false}
                      getOptionCostPerPerson={getOptionCostPerPerson}
                      exchangeRates={exchangeRates}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
              showDelete={false}
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
