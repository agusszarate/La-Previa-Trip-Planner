"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/");
        return;
      }

      // If user already has a custom display_name, skip onboarding
      const emailPrefix = profile.email.split("@")[0];
      if (profile.display_name && profile.display_name !== emailPrefix) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    }

    checkUser();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);

    if (error) {
      alert("Error: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
        <p className="text-blue-200">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">⛷️</h1>
          <h2 className="text-3xl font-bold text-white">¡Bienvenido!</h2>
          <p className="text-blue-200 mt-2">
            Solo falta un paso para empezar
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
            >
              ¿Cómo te llamás?
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              Así te van a ver tus amigos en los viajes
            </p>

            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition"
            >
              {saving ? "Guardando..." : "Empezar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
