"use client";

import type { TripOption, TripMember } from "@/lib/types";

interface OptionCardProps {
  option: TripOption;
  memberCount: number;
  currentUserId: string;
  members: TripMember[];
  onSelect?: () => void;
  onVote?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  showVote?: boolean;
  showSelect?: boolean;
  getOptionCostPerPerson: (opt: TripOption) => number;
}

export default function OptionCard({
  option,
  memberCount,
  currentUserId,
  members,
  onSelect,
  onVote,
  onDelete,
  showDelete = true,
  showVote = true,
  showSelect = true,
  getOptionCostPerPerson,
}: OptionCardProps) {
  const hasVoted = (option.votes || []).includes(currentUserId);
  const voteCount = (option.votes || []).length;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 p-4 transition ${
        option.is_selected
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-gray-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{option.name}</h4>
            {option.is_selected && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Elegido ✓
              </span>
            )}
          </div>
          {option.description && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{option.description}</p>
          )}
          {option.url && (
            <a
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
            >
              Ver link ↗
            </a>
          )}
          {option.notes && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">{option.notes}</p>
          )}
        </div>

        {option.price !== null && option.price !== undefined && (
          <div className="text-right ml-4">
            <p className="font-bold text-gray-900 dark:text-white">
              ${option.price.toLocaleString("es-AR")}
              <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                {option.currency}
              </span>
            </p>
            {!option.is_per_person && memberCount > 1 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ${getOptionCostPerPerson(option).toLocaleString("es-AR", { minimumFractionDigits: 0 })}/persona
              </p>
            )}
            {option.is_per_person && (
              <p className="text-xs text-gray-500 dark:text-slate-400">por persona</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3">
        {showVote && onVote && (
          <button
            onClick={onVote}
            className={`cursor-pointer text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              hasVoted
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600"
            }`}
          >
            👍 {voteCount > 0 ? voteCount : ""}
            {hasVoted ? " Votado" : " Votar"}
          </button>
        )}

        {/* Show who voted */}
        {showVote && voteCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {(option.votes || [])
              .map((v) => {
                const m = members.find((member) => member.user_id === v);
                return m?.profiles?.display_name || m?.profiles?.email?.split("@")[0] || "?";
              })
              .join(", ")}
          </span>
        )}

        <div className="flex-1" />

        {showSelect && onSelect && (
          <button
            onClick={onSelect}
            className={`cursor-pointer text-sm px-3 py-1.5 rounded-lg transition ${
              option.is_selected
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-400"
            }`}
          >
            {option.is_selected ? "✓ Elegido" : "Elegir"}
          </button>
        )}

        {showDelete && onDelete && option.created_by === currentUserId && (
          <button
            onClick={onDelete}
            className="cursor-pointer text-xs text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
