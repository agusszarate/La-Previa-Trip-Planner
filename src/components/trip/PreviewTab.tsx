"use client";

import { useState } from "react";
import type { TripOption, TripMember, OptionCategory } from "@/lib/types";
import { OPTION_CATEGORIES } from "./constants";

interface Props {
  options: TripOption[];
  members: TripMember[];
}

export default function PreviewTab({ options, members }: Props) {
  const memberCount = members.length || 1;

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
      {OPTION_CATEGORIES.map((cat) => {
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
                    {OPTION_CATEGORIES.find((c) => c.value === opt.category)?.icon}
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
