import type { ExpenseCategory, CurrencyType, OptionCategory } from "@/lib/types";

export const TABS = [
  { id: "combo", label: "Armar Combo", icon: "🎯" },
  { id: "preview", label: "Preview", icon: "👁️" },
  { id: "expenses", label: "Gastos", icon: "💰" },
  { id: "members", label: "Miembros", icon: "👥" },
  { id: "accommodation", label: "Alojamiento", icon: "🏠" },
  { id: "flights", label: "Vuelos", icon: "✈️" },
  { id: "checklist", label: "Checklist", icon: "✅" },
] as const;

export const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "accommodation", label: "🏠 Alojamiento" },
  { value: "transport", label: "🚗 Transporte" },
  { value: "food", label: "🍕 Comida" },
  { value: "gear", label: "🎒 Equipamiento" },
  { value: "tickets", label: "🎫 Entradas" },
  { value: "activities", label: "🎯 Actividades" },
  { value: "other", label: "📦 Otros" },
];

export const CURRENCIES: CurrencyType[] = ["ARS", "USD", "EUR", "BRL"];

export const OPTION_CATEGORIES: { value: OptionCategory; label: string; icon: string }[] = [
  { value: "accommodation", label: "Alojamiento", icon: "🏠" },
  { value: "transport_outbound", label: "Transporte (ida)", icon: "✈️" },
  { value: "transport_return", label: "Transporte (vuelta)", icon: "🔙" },
  { value: "tickets", label: "Entradas", icon: "🎫" },
  { value: "gear", label: "Equipamiento", icon: "🎒" },
  { value: "food", label: "Comida", icon: "🍕" },
  { value: "activities", label: "Actividades", icon: "🎯" },
  { value: "other", label: "Otros", icon: "📦" },
];
