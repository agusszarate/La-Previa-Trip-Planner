"use client";

import { useState, useEffect, useCallback } from "react";
import type { CurrencyType } from "@/lib/types";
import {
  fetchExchangeRates,
  convertToARS as convertToARSUtil,
  type ExchangeRates,
} from "@/lib/exchange-rates";

interface UseExchangeRatesReturn {
  rates: ExchangeRates | null;
  loading: boolean;
  error: string | null;
  /** Convert an amount to ARS. Returns null if rates aren't loaded or currency unsupported. */
  convertToARS: (amount: number, currency: CurrencyType) => number | null;
}

/**
 * React hook to fetch and use exchange rates from dolarapi.com.
 * Rates are fetched on mount and cached in-memory (5 min TTL).
 */
export function useExchangeRates(): UseExchangeRatesReturn {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchExchangeRates();
        if (!cancelled) {
          setRates(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error fetching rates");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const convertToARS = useCallback(
    (amount: number, currency: CurrencyType): number | null => {
      if (!rates) return null;
      return convertToARSUtil(amount, currency, rates);
    },
    [rates]
  );

  return { rates, loading, error, convertToARS };
}
