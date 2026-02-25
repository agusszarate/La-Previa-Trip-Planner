-- ============================================
-- Migration: Rename 'skipass' to 'entradas'
-- Run this if you already have the DB deployed
-- with the old 001-schema.sql
-- ============================================

-- Rename in expense_category enum
ALTER TYPE expense_category RENAME VALUE 'skipass' TO 'entradas';

-- Rename in option_category enum
ALTER TYPE option_category RENAME VALUE 'skipass' TO 'entradas';
