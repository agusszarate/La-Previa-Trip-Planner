import type { ExpenseCategory, CurrencyType, OptionCategory } from "@/lib/types";

export const TABS = [
  { id: "combo", label: "Armar Combo", icon: "🎯" },
  { id: "preview", label: "Preview", icon: "👁️" },
  { id: "gastos", label: "Gastos", icon: "💰" },
  { id: "miembros", label: "Miembros", icon: "👥" },
  { id: "alojamiento", label: "Alojamiento", icon: "🏠" },
  { id: "vuelos", label: "Vuelos", icon: "✈️" },
  { id: "checklist", label: "Checklist", icon: "✅" },
] as const;

export const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "alojamiento", label: "🏠 Alojamiento" },
  { value: "transporte", label: "🚗 Transporte" },
  { value: "comida", label: "🍕 Comida" },
  { value: "equipamiento", label: "🎒 Equipamiento" },
  { value: "entradas", label: "🎫 Entradas" },
  { value: "actividades", label: "🎯 Actividades" },
  { value: "otros", label: "📦 Otros" },
];

export const CURRENCIES: CurrencyType[] = ["ARS", "USD", "EUR", "BRL"];

export const OPTION_CATEGORIES: { value: OptionCategory; label: string; icon: string }[] = [
  { value: "alojamiento", label: "Alojamiento", icon: "🏠" },
  { value: "transporte_ida", label: "Transporte (ida)", icon: "✈️" },
  { value: "transporte_vuelta", label: "Transporte (vuelta)", icon: "🔙" },
  { value: "entradas", label: "Entradas", icon: "🎫" },
  { value: "equipamiento", label: "Equipamiento", icon: "🎒" },
  { value: "comida", label: "Comida", icon: "🍕" },
  { value: "actividades", label: "Actividades", icon: "🎯" },
  { value: "otros", label: "Otros", icon: "📦" },
];
