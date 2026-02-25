-- ============================================
-- Migration: Rename Spanish enum values to English
-- Run this if you already have the DB deployed
-- with the old Spanish enum values
-- ============================================

-- Rename expense_category values
ALTER TYPE expense_category RENAME VALUE 'alojamiento' TO 'accommodation';
ALTER TYPE expense_category RENAME VALUE 'transporte' TO 'transport';
ALTER TYPE expense_category RENAME VALUE 'comida' TO 'food';
ALTER TYPE expense_category RENAME VALUE 'equipamiento' TO 'gear';
ALTER TYPE expense_category RENAME VALUE 'entradas' TO 'tickets';
ALTER TYPE expense_category RENAME VALUE 'actividades' TO 'activities';
ALTER TYPE expense_category RENAME VALUE 'otros' TO 'other';

-- Rename option_category values
ALTER TYPE option_category RENAME VALUE 'alojamiento' TO 'accommodation';
ALTER TYPE option_category RENAME VALUE 'transporte_ida' TO 'transport_outbound';
ALTER TYPE option_category RENAME VALUE 'transporte_vuelta' TO 'transport_return';
ALTER TYPE option_category RENAME VALUE 'entradas' TO 'tickets';
ALTER TYPE option_category RENAME VALUE 'equipamiento' TO 'gear';
ALTER TYPE option_category RENAME VALUE 'comida' TO 'food';
ALTER TYPE option_category RENAME VALUE 'actividades' TO 'activities';
ALTER TYPE option_category RENAME VALUE 'otros' TO 'other';
