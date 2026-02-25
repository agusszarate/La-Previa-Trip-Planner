"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChecklistItem, TripMember } from "@/lib/types";

interface Props {
  checklist: ChecklistItem[];
  members: TripMember[];
  tripId: string;
  currentUserId: string;
  supabase: SupabaseClient;
  refresh: () => void;
}

export default function ChecklistTab({
  checklist,
  members,
  tripId,
  currentUserId,
  supabase,
  refresh,
}: Props) {
  const [text, setText] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    await supabase.from("checklist_items").insert({
      trip_id: tripId,
      text: text.trim(),
      assigned_to: assignedTo || null,
      created_by: currentUserId,
    });

    setText("");
    setAssignedTo("");
    refresh();
  }

  async function toggleItem(id: string, isDone: boolean) {
    await supabase
      .from("checklist_items")
      .update({ is_done: !isDone })
      .eq("id", id);
    refresh();
  }

  const done = checklist.filter((i) => i.is_done);
  const pending = checklist.filter((i) => !i.is_done);

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 flex gap-3"
      >
        <input
          type="text"
          placeholder="Agregar item (ej: cargador portátil)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-sm text-gray-700"
        >
          <option value="">Sin asignar</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.profiles?.display_name || m.profiles?.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          +
        </button>
      </form>

      {/* Pending */}
      <div className="space-y-2">
        {pending.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-3 flex items-center gap-3"
          >
            <button
              onClick={() => toggleItem(item.id, item.is_done)}
              className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-500 hover:border-blue-500 dark:hover:border-blue-400 flex items-center justify-center transition flex-shrink-0"
            />
            <span className="flex-1 text-gray-800 dark:text-slate-200">{item.text}</span>
            {item.profiles && (
              <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-full">
                {(item as any).profiles?.display_name ||
                  (item as any).profiles?.email}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
            Completados ({done.length})
          </p>
          <div className="space-y-2">
            {done.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleItem(item.id, item.is_done)}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-white text-xs">✓</span>
                </button>
                <span className="flex-1 text-gray-400 dark:text-slate-500 line-through">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {checklist.length === 0 && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-8">
          Checklist vacío — agregá items arriba
        </p>
      )}
    </div>
  );
}
