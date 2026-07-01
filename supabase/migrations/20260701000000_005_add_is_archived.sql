-- Migration: Add is_archived column to orders
ALTER TABLE orders ADD COLUMN is_archived BOOLEAN DEFAULT false;
