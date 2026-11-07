-- Separate database for API tests (AGENTS.md §8). Tests never touch the dev database.
-- The test setup applies the schema to it from the same files in this folder.
CREATE DATABASE climafacil_test;
