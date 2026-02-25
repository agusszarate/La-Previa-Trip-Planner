"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlightWatch, CurrencyType } from "@/lib/types";
import { CURRENCIES } from "./constants";

interface Props {
  flights: FlightWatch[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
}

export default function FlightsTab({
  flights,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: Props) {
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
        {flights.map((f) => (
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
