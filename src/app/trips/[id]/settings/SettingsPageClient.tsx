"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Trip } from "@/lib/types";

interface Props {
  trip: Trip;
  tripId: string;
  isOwner: boolean;
}

export default function SettingsPageClient({ trip, tripId, isOwner }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: trip.name || "",
    description: trip.description || "",
    destination: trip.destination || "",
    start_date: trip.start_date || "",
    end_date: trip.end_date || "",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("trips")
      .update({
        name: form.name,
        description: form.description || null,
        destination: form.destination || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })
      .eq("id", tripId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de que querés eliminar este viaje? Esta acción no se puede deshacer.")) return;
    if (!confirm("¿SEGURO? Se eliminarán todos los gastos, opciones y datos del viaje.")) return;

    const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Error al eliminar el viaje");
      return;
    }

    router.push("/dashboard");
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:bg-slate-800 dark:text-white";

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ajustes del viaje</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Nombre del viaje *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Destino
            </label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Ej: Cerro Catedral, Bariloche"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notas sobre el viaje..."
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {/* Danger zone */}
      {isOwner && (
        <div className="mt-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Zona peligrosa</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            Eliminar el viaje borra todos los datos asociados (gastos, opciones, miembros). Esta acción no se puede deshacer.
          </p>
          <button
            onClick={handleDelete}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Eliminar viaje
          </button>
        </div>
      )}
    </div>
  );
}
