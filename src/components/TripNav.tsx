"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  tripId: string;
  isOwner: boolean;
}

const NAV_ITEMS = [
  { href: "", label: "Viaje", icon: "🗺️" },
  { href: "/members", label: "Miembros", icon: "👥" },
  { href: "/expenses", label: "Gastos", icon: "💰" },
  { href: "/checklist", label: "Checklist", icon: "✅" },
];

export default function TripNav({ tripId, isOwner }: Props) {
  const pathname = usePathname();
  const basePath = `/trips/${tripId}`;

  const items = isOwner
    ? [...NAV_ITEMS, { href: "/settings", label: "Ajustes", icon: "⚙️" }]
    : NAV_ITEMS;

  return (
    <nav className="flex flex-wrap gap-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-1">
      {items.map((item) => {
        const fullHref = `${basePath}${item.href}`;
        const isActive =
          item.href === ""
            ? pathname === basePath
            : pathname.startsWith(fullHref);

        return (
          <Link
            key={item.href}
            href={fullHref}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
