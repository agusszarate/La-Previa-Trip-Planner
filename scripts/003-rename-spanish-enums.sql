-- ============================================
-- Migration: Rename Spanish enum values to English
-- Safe to run regardless of current DB state
-- ============================================

-- Helper function to safely rename enum values
-- (skips if old value doesn't exist or new value already exists)
CREATE OR REPLACE FUNCTION safe_rename_enum_value(
  enum_name text, old_val text, new_val text
) RETURNS void AS $$
DECLARE
  old_exists boolean;
  new_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_name AND e.enumlabel = old_val
  ) INTO old_exists;

  SELECT EXISTS(
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_name AND e.enumlabel = new_val
  ) INTO new_exists;

  IF old_exists AND NOT new_exists THEN
    EXECUTE format('ALTER TYPE %I RENAME VALUE %L TO %L', enum_name, old_val, new_val);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Rename expense_category values
-- ============================================
SELECT safe_rename_enum_value('expense_category', 'alojamiento', 'accommodation');
SELECT safe_rename_enum_value('expense_category', 'transporte', 'transport');
SELECT safe_rename_enum_value('expense_category', 'comida', 'food');
SELECT safe_rename_enum_value('expense_category', 'equipamiento', 'gear');
SELECT safe_rename_enum_value('expense_category', 'skipass', 'tickets');
SELECT safe_rename_enum_value('expense_category', 'entradas', 'tickets');
SELECT safe_rename_enum_value('expense_category', 'actividades', 'activities');
SELECT safe_rename_enum_value('expense_category', 'otros', 'other');

-- ============================================
-- Rename option_category values
-- ============================================
SELECT safe_rename_enum_value('option_category', 'alojamiento', 'accommodation');
SELECT safe_rename_enum_value('option_category', 'transporte_ida', 'transport_outbound');
SELECT safe_rename_enum_value('option_category', 'transporte_vuelta', 'transport_return');
SELECT safe_rename_enum_value('option_category', 'skipass', 'tickets');
SELECT safe_rename_enum_value('option_category', 'entradas', 'tickets');
SELECT safe_rename_enum_value('option_category', 'equipamiento', 'gear');
SELECT safe_rename_enum_value('option_category', 'comida', 'food');
SELECT safe_rename_enum_value('option_category', 'actividades', 'activities');
SELECT safe_rename_enum_value('option_category', 'otros', 'other');

-- Clean up helper function
DROP FUNCTION safe_rename_enum_value(text, text, text);
