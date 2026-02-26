import type { CurrencyType } from "./types";

export interface ExchangeRates {
  USD: number;
  EUR: number;
  BRL: number;
  CLP: number;
  UYU: number;
  updatedAt: Date;
}

type ForeignCurrency = keyof Omit<ExchangeRates, "updatedAt">;

const API_URLS: Record<ForeignCurrency, string> = {
  USD: "https://dolarapi.com/v1/dolares/blue",
  EUR: "https://dolarapi.com/v1/cotizaciones/eur",
  BRL: "https://dolarapi.com/v1/cotizaciones/brl",
  CLP: "https://dolarapi.com/v1/cotizaciones/clp",
  UYU: "https://dolarapi.com/v1/cotizaciones/uyu",
};

// In-memory cache
let cachedRates: ExchangeRates | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch exchange rates from dolarapi.com.
 * All rates are "venta" (sell price in ARS for 1 unit of foreign currency).
 * Uses a 5-minute in-memory cache to avoid excessive API calls.
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Return cached rates if fresh
  if (cachedRates && Date.now() - cachedRates.updatedAt.getTime() < CACHE_TTL_MS) {
    return cachedRates;
  }

  const currencies = Object.keys(API_URLS) as ForeignCurrency[];

  const results = await Promise.allSettled(
    currencies.map(async (currency) => {
      const res = await fetch(API_URLS[currency]);
      if (!res.ok) throw new Error(`Failed to fetch ${currency}: ${res.status}`);
      const data = await res.json();
      return { currency, rate: data.venta as number };
    })
  );

  const rates: Partial<Record<ForeignCurrency, number>> = {};

  for (const result of results) {
    if (result.status === "fulfilled") {
      rates[result.value.currency] = result.value.rate;
    }
  }

  // Use cached values as fallback for any failed requests
  const newRates: ExchangeRates = {
    USD: rates.USD ?? cachedRates?.USD ?? 0,
    EUR: rates.EUR ?? cachedRates?.EUR ?? 0,
    BRL: rates.BRL ?? cachedRates?.BRL ?? 0,
    CLP: rates.CLP ?? cachedRates?.CLP ?? 0,
    UYU: rates.UYU ?? cachedRates?.UYU ?? 0,
    updatedAt: new Date(),
  };

  cachedRates = newRates;
  return newRates;
}

/**
 * Convert an amount in a given currency to ARS.
 * ARS amounts are returned as-is.
 * Returns null if rates are unavailable for the given currency.
 */
export function convertToARS(
  amount: number,
  currency: CurrencyType,
  rates: ExchangeRates
): number | null {
  if (currency === "ARS") return amount;

  const rate = rates[currency as ForeignCurrency];
  if (!rate || rate === 0) return null;

  return amount * rate;
}
