"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trip } from "@/lib/types";

interface Props {
  trip: Trip;
  code: string;
}

export default function InviteClient({ trip, code }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/invite/${code}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🌍</h1>
          <h2 className="text-2xl font-bold text-white">
            Te invitaron a La Previa
          </h2>
          <div className="mt-4 bg-white/10 rounded-xl p-4 backdrop-blur">
            <p className="text-xl font-semibold text-white">{trip.name}</p>
            {trip.destination && (
              <p className="text-blue-200 mt-1">📍 {trip.destination}</p>
            )}
            {trip.start_date && (
              <p className="text-blue-200 text-sm mt-1">
                📅{" "}
                {new Date(trip.start_date).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">
                ¡Revisá tu email!
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                Te enviamos un link a{" "}
                <span className="font-medium">{email}</span>. Al hacer click,
                te vas a unir al viaje automáticamente.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <p className="text-gray-600 mb-4 text-center">
                Ingresá tu email para unirte
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-email@ejemplo.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 dark:bg-slate-800 dark:text-white"
              />

              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition"
              >
                {loading ? "Enviando..." : "Unirme al viaje"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
