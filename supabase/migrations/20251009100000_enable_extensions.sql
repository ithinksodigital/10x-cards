-- Migration: Enable Required PostgreSQL Extensions
-- Purpose: Enable necessary extensions for trigram search and case-insensitive text
-- Affected: Database-wide extensions
-- Special Considerations: These extensions are required before creating tables

-- enable citext extension for case-insensitive text type
-- used in sets.name to allow case-insensitive unique constraints
create extension if not exists citext;

-- enable pg_trgm extension for trigram-based similarity search
-- used for fuzzy searching on cards.front and cards.back columns
create extension if not exists pg_trgm;

-- enable uuid-ossp for uuid generation
-- used for generating primary keys
create extension if not exists "uuid-ossp";

