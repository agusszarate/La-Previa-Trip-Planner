-- ============================================
-- Migration: Add multi-payer support to expenses
-- Adds a payers JSONB column to store multiple payers
-- Format: [{"user_id": "uuid", "amount": 100.00}, ...]
-- When NULL, falls back to paid_by for full amount
-- Safe to run multiple times (IF NOT EXISTS check)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expenses'
      AND column_name = 'payers'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN payers jsonb;
  END IF;
END $$;
