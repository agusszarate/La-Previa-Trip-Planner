"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
          <h1 className="text-5xl font-bold text-white mb-2">⛷️</h1>
          <h2 className="text-3xl font-bold text-white">La Previa</h2>
          <p className="text-blue-200 mt-2">
            Organizá tu viaje con amigos
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                ¡Revisá tu email!
              </h3>
              <p className="text-gray-600">
                Te enviamos un link mágico a{" "}
                <span className="font-medium">{email}</span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
              >
                Usar otro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tu email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
              />

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition"
              >
                {loading ? "Enviando..." : "Entrar con Magic Link"}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Te vamos a enviar un link a tu email para iniciar sesión.
                Sin contraseña.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
