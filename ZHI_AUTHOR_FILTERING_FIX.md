# CRITICAL FIX: Intelligent Author Detection + Strict Filtering

## Problem Identified (EZHW Report)
EZHW was getting **inconsistent results** when requesting author-specific quotes:

**Test Results (9 queries for "[AUTHOR] QUOTES"):**
- ✅ Correct Returns (5/9): Kuczynski, Darwin, Kant, Freud, Russell
- ❌ Wrong Returns (4/9):
  - Nietzsche query → Returned "Liberalism" instead
  - Plato query → Returned "The Sayings of Confucius" instead
  - Aristotle query → Returned "Collected Works of René Descartes" instead
  - Marx query → Returned "Collected Works of Vladimir Lenin" instead

**Root Causes Found:**
1. **Missing parameter pass**: `/zhi/query` endpoint wasn't passing `author` to search function (line 1118)
2. **No author detection**: EZHW sends `{ "query": "GIVE ME PLATO QUOTES" }` without `author` field
3. **Semantic drift**: When no author filter applied, topic similarity wins over author identity

## Two-Part Solution Implemented

### Part 1: Intelligent Author Detection (NEW)
**File**: `server/vector-search.ts` - Added `detectAuthorFromQuery()` function

```typescript
// Automatically detects author names in query text
// "GIVE ME PLATO QUOTES" → detects "Plato"
// Verifies author exists in database before applying filter

export async function detectAuthorFromQuery(queryText: string): Promise<string | undefined> {
  // Checks 33 common author patterns (Kuczynski, Russell, Plato, etc.)
  // Case-insensitive matching
  // Database verification to prevent false positives
  
  const queryUpper = queryText.toUpperCase();
  for (const authorName of authorPatterns) {
    if (queryUpper.includes(authorName.toUpperCase())) {
      // Verify author has content in database
      const count = await checkAuthorExists(authorName);
      if (count > 0) return authorName;
    }
  }
  return undefined;
}
```

### Part 2: STRICT Author-First Retrieval
**File**: `server/vector-search.ts` - Modified `searchPhilosophicalChunks()`

```typescript
// When author specified (explicit OR auto-detected), ONLY search that author
if (authorFilter) {
  console.log(`[Vector Search] STRICT author filter: "${authorFilter}"`);
  
  // Search ONLY the specified author's chunks
  WHERE figure_id = 'common'
    AND author ILIKE '%Kuczynski%'  // MANDATORY filter
  ORDER BY semantic_distance  // Within author's content only
  
  // Returns ONLY author's content, never mixes other authors
}
```

### Part 3: Apply to Both Endpoints
**File**: `server/routes.ts` - Updated `/zhi/query` AND `/api/internal/knowledge`

```typescript
// Auto-detect author from query text if not explicitly provided
let detectedAuthor = author;
if (!detectedAuthor && query) {
  detectedAuthor = await detectAuthorFromQuery(query);
  if (detectedAuthor) {
    console.log(`🎯 Auto-detected author: "${detectedAuthor}"`);
  }
}

// Pass detected/explicit author to search (THIS WAS MISSING BEFORE!)
const passages = await searchPhilosophicalChunks(query, limit, "common", detectedAuthor);
```

## Fix Details

**File Modified**: `server/vector-search.ts`

**Key Changes**:
1. **Two-Tier Approach**: If `author` parameter specified → search ONLY that author's chunks
2. **Strict Mode**: Returns author's content even if fewer results than requested
3. **No Mixing**: Never supplements with other authors' content
4. **Console Logging**: Logs "STRICT author filter" for debugging

## Authors Available for Testing

| Author | Chunks | Works | Status |
|--------|--------|-------|--------|
| J.-M. Kuczynski | 3,795 | 77 | ✅ Ready |
| William James | 2,366 | Multiple | ✅ Ready |
| Bertrand Russell | 1,512 | Multiple | ✅ Ready |
| Isaac Newton | 1,451 | Multiple | ✅ Ready |
| C.G. Jung | 1,330 | Multiple | ✅ Ready |
| Edgar Allan Poe | 956 | 5 volumes | ✅ Ready |
| Gottfried Wilhelm Leibniz | 887 | Complete works | ✅ Ready |
| Ludwig von Mises | 858 | Multiple | ✅ Ready |
| Thorstein Veblen | 758 | 3 batches | ✅ Ready |
| John Dewey | 743 | Multiple | ✅ Ready |
| Vladimir Lenin | 601 | Multiple | ✅ Ready |
| G.W.F. Hegel | 574 | Multiple | ✅ Ready |
| Sigmund Freud | 503 | Multiple | ✅ Ready |

## Test Cases for EZHW

### Test 1: Kuczynski Quotes (Basic)
```json
{
  "query": "GIVE ME 5 KUCZYNSKI QUOTES",
  "author": "Kuczynski",
  "maxResults": 5
}
```
**Expected**: All 5 results from J.-M. Kuczynski, no other authors

### Test 2: Kuczynski Quotes (Higher Count)
```json
{
  "query": "GIVE ME 10 KUCZYNSKI QUOTES",
  "author": "Kuczynski",
  "maxResults": 10
}
```
**Expected**: All 10 results from J.-M. Kuczynski, no other authors

### Test 3: Kuczynski with Topic Filter
```json
{
  "query": "Get me quotes from Kuczynski about consciousness",
  "author": "Kuczynski",
  "maxResults": 10
}
```
**Expected**: All 10 results from J.-M. Kuczynski about consciousness, no Lenin/others

### Test 4: Russell on Logic
```json
{
  "query": "Russell's views on logic and mathematics",
  "author": "Russell",
  "maxResults": 10
}
```
**Expected**: All 10 results from Bertrand Russell, no other authors

### Test 5: Jung on Unconscious
```json
{
  "query": "Jung's theory of the collective unconscious",
  "author": "Jung",
  "maxResults": 10
}
```
**Expected**: All 10 results from C.G. Jung, no Freud or others

### Test 6: Partial Name Matching
```json
{
  "query": "quotes about rationality",
  "author": "Kuczynski",  // Matches "J.-M. Kuczynski" via ILIKE
  "maxResults": 10
}
```
**Expected**: All 10 results from J.-M. Kuczynski

### Test 7: No Author Filter (Mixed Results OK)
```json
{
  "query": "philosophical views on consciousness",
  // NO author parameter
  "maxResults": 10
}
```
**Expected**: Mixed results from multiple authors (normal semantic search)

## Verification Checklist

For each test, verify:
- [ ] **Author field**: Every result has correct author name
- [ ] **No mixing**: Zero results from other authors when author specified
- [ ] **Full count**: Returns requested number of results (if author has enough content)
- [ ] **Semantic relevance**: Within author's content, most relevant chunks first
- [ ] **Paper titles**: All from specified author's works
- [ ] **Console logs**: Backend shows "STRICT author filter: [author]"

## Expected Behavior Summary

### When `author` Parameter Specified:
✅ Returns ONLY that author's content
✅ Never mixes in other authors
✅ Partial name matching works (e.g., "Kuczynski" matches "J.-M. Kuczynski")
✅ Semantic ranking applies within author's content only
✅ Returns fewer results if author doesn't have enough content (no padding)

### When `author` Parameter NOT Specified:
✅ Normal cross-author semantic search
✅ Returns most semantically relevant content from all authors
✅ Results can contain multiple different authors

## Rollback Plan

If issues persist, the fix can be reverted by:
1. Restoring previous `searchPhilosophicalChunks` function from git history
2. Workflow restart

## How It Works Now

**EZHW Query**: `{ "query": "GIVE ME 3 PLATO QUOTES", "limit": 10 }`

**Processing Flow:**
1. ✅ Extract query text: "GIVE ME 3 PLATO QUOTES"
2. ✅ Auto-detect author: Finds "PLATO" in text
3. ✅ Verify in database: Checks if Plato content exists  
4. ❌ Plato has 0 chunks → Falls back to semantic search
5. ✅ Returns best semantic matches (with warning that Plato unavailable)

**EZHW Query**: `{ "query": "GIVE ME 10 KUCZYNSKI QUOTES", "limit": 10 }`

**Processing Flow:**
1. ✅ Extract query text: "GIVE ME 10 KUCZYNSKI QUOTES"
2. ✅ Auto-detect author: Finds "KUCZYNSKI" in text
3. ✅ Verify in database: Kuczynski has 3,795 chunks ✓
4. ✅ Apply STRICT filter: Search ONLY Kuczynski's 3,795 chunks
5. ✅ Returns 10 Kuczynski chunks, 0 from other authors

## Notes

- **Deployment**: Fix live as of Nov 11, 2025 23:35 UTC (Part 2)
- **Backwards Compatible**: No breaking changes to API contract
- **Performance**: Minimal impact (+1 DB query for author detection when needed)
- **Supported Authors**: 33 patterns covering all embedded figures
- **Console Logging**: Shows `🎯 Auto-detected author` for debugging
- **Math Classics**: Currently embedding 448 chunks (Levin, Klein, Gauss, Dedekind)
- **Maimonides**: Added as 46th philosopher (UI only, no embedded texts yet)
