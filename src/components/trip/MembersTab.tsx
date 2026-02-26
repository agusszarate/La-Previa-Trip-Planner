"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripMember } from "@/lib/types";

interface Props {
  members: TripMember[];
  tripId: string;
  isOwner: boolean;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
}

export default function MembersTab({ members, tripId, isOwner, currentUserId, supabase, refresh }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  async function handleGenerateInvite() {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/trips/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = data.url.startsWith("http")
          ? data.url
          : `${window.location.origin}/invite/${data.code}`;
        setInviteLink(fullUrl);
        navigator.clipboard.writeText(fullUrl).catch(() => {});
      } else {
        alert("Error: " + (data.error || "No se pudo generar"));
      }
    } catch {
      alert("Error de conexión");
    }
    setGeneratingLink(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      alert(
        "No se encontró un usuario con ese email. Debe registrarse primero."
      );
      setLoading(false);
      return;
    }

    const exists = members.find((m) => m.user_id === profile.id);
    if (exists) {
      alert("Ya es miembro del viaje");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("trip_members").insert({
      trip_id: tripId,
      user_id: profile.id,
      role: "member",
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setEmail("");
      refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <form
          onSubmit={handleInvite}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 flex gap-3"
        >
          <input
            type="email"
            required
            placeholder="Email del amigo a agregar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-medium transition whitespace-nowrap"
          >
            {loading ? "..." : "Agregar"}
          </button>
        </form>
      )}

      {/* Invite Link */}
      {isOwner && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Compartí este link para que se sumen
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Cualquiera con el link puede unirse al viaje
              </p>
            </div>
            <button
              onClick={handleGenerateInvite}
              disabled={generatingLink}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {generatingLink ? "..." : "Generar Link"}
            </button>
          </div>
          {inviteLink && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-sm text-gray-700 dark:text-slate-200"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("¡Link copiado!");
                }}
                className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                {(
                  m.profiles?.display_name?.[0] ||
                  m.profiles?.email?.[0] ||
                  "?"
                ).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {m.profiles?.display_name || m.profiles?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{m.profiles?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && m.user_id !== currentUserId ? (
                <>
                  <select
                    value={m.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      await supabase
                        .from("trip_members")
                        .update({ role: newRole })
                        .eq("id", m.id);
                      refresh();
                    }}
                    className="cursor-pointer text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="member">Miembro</option>
                    <option value="owner">Organizador</option>
                  </select>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar a ${m.profiles?.display_name || m.profiles?.email} del viaje?`)) return;
                      await supabase.from("trip_members").delete().eq("id", m.id);
                      refresh();
                    }}
                    className="cursor-pointer text-xs text-red-500 hover:text-red-700 transition"
                  >
                    Quitar
                  </button>
                </>
              ) : (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    m.role === "owner"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  {m.role === "owner" ? "Organizador" : "Miembro"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
