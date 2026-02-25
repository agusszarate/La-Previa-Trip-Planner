"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Accommodation, CurrencyType } from "@/lib/types";
import { CURRENCIES } from "./constants";

interface Props {
  accommodations: Accommodation[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
}

export default function AccommodationsTab({
  accommodations,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: Props) {
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
        {accommodations.map((acc) => (
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
