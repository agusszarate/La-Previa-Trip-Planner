"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripOption, TripMember, FlightWatch, OptionCategory, CurrencyType } from "@/lib/types";
import { CURRENCIES } from "./constants";
import OptionCard from "./OptionCard";

interface Props {
  options: TripOption[];
  flights: FlightWatch[];
  members: TripMember[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
}

type TransportDirection = "transport_outbound" | "transport_return";

export default function TransportTab({
  options,
  flights,
  members,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: Props) {
  const [activeDirection, setActiveDirection] = useState<TransportDirection>("transport_outbound");
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const memberCount = members.length || 1;

  // Option form
  const [optionForm, setOptionForm] = useState({
    name: "",
    description: "",
    url: "",
    price: "",
    currency: "ARS" as CurrencyType,
    is_per_person: false,
    notes: "",
  });

  // Flight alert form
  const [flightForm, setFlightForm] = useState({
    origin: "EZE",
    destination: "BRC",
    date_from: "",
    date_to: "",
    max_price: "",
    currency: "ARS" as CurrencyType,
    alert_email: "",
  });

  const directionOptions = options.filter((o) => o.category === activeDirection);

  function getOptionCostPerPerson(opt: TripOption): number {
    if (!opt.price) return 0;
    if (opt.is_per_person) return opt.price;
    return opt.price / memberCount;
  }

  // --- Option CRUD ---
  async function handleAddOption(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const price = optionForm.price ? parseFloat(optionForm.price) : null;

    const { error } = await supabase.from("trip_options").insert({
      trip_id: tripId,
      category: activeDirection,
      name: optionForm.name,
      description: optionForm.description || null,
      url: optionForm.url || null,
      price,
      currency: optionForm.currency,
      price_per_person: price && !optionForm.is_per_person ? Math.round((price / memberCount) * 100) / 100 : price,
      is_per_person: optionForm.is_per_person,
      notes: optionForm.notes || null,
      created_by: currentUserId,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setOptionForm({ name: "", description: "", url: "", price: "", currency: "ARS", is_per_person: false, notes: "" });
      setShowOptionForm(false);
      refresh();
    }
    setLoading(false);
  }

  async function handleSelect(optionId: string) {
    for (const opt of directionOptions) {
      if (opt.is_selected) {
        await supabase.from("trip_options").update({ is_selected: false }).eq("id", opt.id);
      }
    }
    await supabase.from("trip_options").update({ is_selected: true }).eq("id", optionId);
    refresh();
  }

  async function handleVote(optionId: string, currentVotes: string[]) {
    const hasVoted = currentVotes.includes(currentUserId);
    const newVotes = hasVoted
      ? currentVotes.filter((v) => v !== currentUserId)
      : [...currentVotes, currentUserId];
    await supabase.from("trip_options").update({ votes: newVotes }).eq("id", optionId);
    refresh();
  }

  async function handleDeleteOption(optionId: string) {
    if (!confirm("¿Eliminar esta opción?")) return;
    await supabase.from("trip_options").delete().eq("id", optionId);
    refresh();
  }

  // --- Flight alerts ---
  async function handleAddFlight(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("flights_watchlist").insert({
      trip_id: tripId,
      origin: flightForm.origin.toUpperCase(),
      destination: flightForm.destination.toUpperCase(),
      date_from: flightForm.date_from,
      date_to: flightForm.date_to || null,
      max_price: flightForm.max_price ? parseFloat(flightForm.max_price) : null,
      currency: flightForm.currency,
      alert_email: flightForm.alert_email || null,
      created_by: currentUserId,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setShowFlightForm(false);
      refresh();
    }
    setLoading(false);
  }

  const directionLabel = activeDirection === "transport_outbound" ? "ida" : "vuelta";

  return (
    <div className="space-y-6">
      {/* Direction Toggle */}
      <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-1">
        <button
          onClick={() => setActiveDirection("transport_outbound")}
          className={`cursor-pointer flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeDirection === "transport_outbound"
              ? "bg-blue-600 text-white"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          }`}
        >
          ✈️ Ida
        </button>
        <button
          onClick={() => setActiveDirection("transport_return")}
          className={`cursor-pointer flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            activeDirection === "transport_return"
              ? "bg-blue-600 text-white"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          }`}
        >
          🔙 Vuelta
        </button>
      </div>

      {/* Add Transport Option */}
      {!showOptionForm ? (
        <button
          onClick={() => setShowOptionForm(true)}
          className="cursor-pointer w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
        >
          + Agregar opción de transporte ({directionLabel})
        </button>
      ) : (
        <form
          onSubmit={handleAddOption}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-800 dark:text-slate-100">
            Nueva opción — Transporte ({directionLabel})
          </h3>

          <input
            type="text"
            required
            placeholder="Nombre (ej: Aerolíneas EZE → BRC)"
            value={optionForm.name}
            onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={optionForm.description}
            onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <input
            type="url"
            placeholder="Link (opcional)"
            value={optionForm.url}
            onChange={(e) => setOptionForm({ ...optionForm, url: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={optionForm.price}
              onChange={(e) => setOptionForm({ ...optionForm, price: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={optionForm.currency}
              onChange={(e) => setOptionForm({ ...optionForm, currency: e.target.value as CurrencyType })}
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
              checked={optionForm.is_per_person}
              onChange={(e) => setOptionForm({ ...optionForm, is_per_person: e.target.checked })}
              className="rounded"
            />
            El precio ya es por persona
          </label>

          <textarea
            placeholder="Notas (opcional)"
            value={optionForm.notes}
            onChange={(e) => setOptionForm({ ...optionForm, notes: e.target.value })}
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
              onClick={() => setShowOptionForm(false)}
              className="cursor-pointer px-4 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Transport Options List */}
      <div className="space-y-3">
        {directionOptions.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            memberCount={memberCount}
            currentUserId={currentUserId}
            members={members}
            onSelect={() => handleSelect(opt.id)}
            onVote={() => handleVote(opt.id, opt.votes || [])}
            onDelete={() => handleDeleteOption(opt.id)}
            getOptionCostPerPerson={getOptionCostPerPerson}
          />
        ))}
        {directionOptions.length === 0 && !showOptionForm && (
          <p className="text-center text-gray-400 dark:text-slate-500 py-4">
            No hay opciones de transporte ({directionLabel}) todavía
          </p>
        )}
      </div>

      {/* Flight Alerts Section */}
      <div className="border-t-2 border-gray-200 dark:border-slate-700 pt-6">
        <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          🔔 Alertas de vuelo
          <span className="text-xs font-normal text-gray-400 dark:text-slate-500">
            Monitoreo de precios
          </span>
        </h3>

        {!showFlightForm ? (
          <button
            onClick={() => setShowFlightForm(true)}
            className="cursor-pointer w-full bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
          >
            + Agregar alerta de vuelo
          </button>
        ) : (
          <form
            onSubmit={handleAddFlight}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4"
          >
            <h3 className="font-semibold text-gray-800 dark:text-slate-100">
              Nueva Alerta de Vuelo
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Origen (IATA)</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  placeholder="EZE"
                  value={flightForm.origin}
                  onChange={(e) => setFlightForm({ ...flightForm, origin: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Destino (IATA)</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  placeholder="BRC"
                  value={flightForm.destination}
                  onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Fecha ida</label>
                <input
                  type="date"
                  required
                  value={flightForm.date_from}
                  onChange={(e) => setFlightForm({ ...flightForm, date_from: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Fecha vuelta</label>
                <input
                  type="date"
                  value={flightForm.date_to}
                  onChange={(e) => setFlightForm({ ...flightForm, date_to: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                placeholder="Precio máximo (alertar si baja)"
                value={flightForm.max_price}
                onChange={(e) => setFlightForm({ ...flightForm, max_price: e.target.value })}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
              <select
                value={flightForm.currency}
                onChange={(e) => setFlightForm({ ...flightForm, currency: e.target.value as CurrencyType })}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <input
              type="email"
              placeholder="Email para alertas (opcional)"
              value={flightForm.alert_email}
              onChange={(e) => setFlightForm({ ...flightForm, alert_email: e.target.value })}
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
                onClick={() => setShowFlightForm(false)}
                className="cursor-pointer px-4 py-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3 mt-4">
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
                    {f.date_to && ` — ${new Date(f.date_to).toLocaleDateString("es-AR")}`}
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
                    Chequeado: {new Date(f.last_checked_at).toLocaleString("es-AR")}
                  </span>
                )}
              </div>
            </div>
          ))}
          {flights.length === 0 && !showFlightForm && (
            <p className="text-center text-gray-400 dark:text-slate-500 py-4">
              No hay alertas de vuelo configuradas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
