-- ============================================
-- Migration: Rename 'skipass' to 'tickets'
-- Run this if you already have the DB deployed
-- with the original 001-schema.sql that had 'skipass'
-- ============================================

-- Rename in expense_category enum
ALTER TYPE expense_category RENAME VALUE 'skipass' TO 'tickets';

-- Rename in option_category enum
ALTER TYPE option_category RENAME VALUE 'skipass' TO 'tickets';
