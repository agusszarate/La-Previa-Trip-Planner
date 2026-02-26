-- ============================================
-- Migration: Add CLP and UYU to currency_type enum
-- Safe to run multiple times (IF NOT EXISTS)
-- ============================================

ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'CLP';
ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'UYU';
