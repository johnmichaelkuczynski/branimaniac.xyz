-- ================================================
-- MIGRATION: Unified Knowledge Base
-- ================================================
-- Purpose: Consolidate all philosophical texts into Common Fund (figure_id='common')
-- Previous: Embeddings separated by philosopher (jmk, freud, veblen, etc.)
-- New: Single unified pool accessible to all querying applications
-- 
-- CRITICAL: Backup database before running!
-- Command: pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
-- 
-- Rollback: UPDATE paper_chunks SET figure_id = '[original_value]' WHERE...
-- (Note: Original figure_id values not preserved - backup is essential)
-- ================================================

BEGIN;

-- Show current distribution before migration
SELECT 
  figure_id, 
  COUNT(*) as chunk_count,
  COUNT(DISTINCT paper_title) as paper_count
FROM paper_chunks
GROUP BY figure_id
ORDER BY chunk_count DESC;

-- Consolidate all philosopher-specific embeddings into Common Fund
UPDATE paper_chunks 
SET figure_id = 'common'
WHERE figure_id != 'common';

-- Show new distribution after migration
SELECT 
  figure_id, 
  COUNT(*) as chunk_count,
  COUNT(DISTINCT paper_title) as paper_count
FROM paper_chunks
GROUP BY figure_id
ORDER BY chunk_count DESC;

-- Verify no philosopher-specific embeddings remain
SELECT COUNT(*) as should_be_zero
FROM paper_chunks
WHERE figure_id NOT IN ('common');

COMMIT;

-- ================================================
-- Post-Migration Notes:
-- - All embeddings now stored with figure_id='common'
-- - Future embeddings (via generate-embeddings.ts) automatically use 'common'
-- - Knowledge API queries single unified pool
-- - No need to regenerate embeddings (expensive)
-- ================================================
