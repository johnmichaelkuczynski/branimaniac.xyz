# Plato SQLite Database & API Documentation

## Overview
Complete SQLite database system for Plato's philosophical positions with REST API endpoints.

## Database Statistics
- **Total Positions**: 182 philosophical positions
- **Dialogues**: 19 dialogues covered
- **Speakers**: 14 different speakers
- **ID Range**: 0001 to 3017
- **Database File**: `plato-positions.db` (68 KB)

## Database Schema

```sql
CREATE TABLE plato_positions (
  id TEXT PRIMARY KEY,
  dialogue TEXT NOT NULL,
  location TEXT NOT NULL,
  speaker TEXT NOT NULL,
  claim TEXT NOT NULL,
  context TEXT NOT NULL,
  keywords TEXT NOT NULL  -- JSON array stored as string
);

-- Indexes for fast querying
CREATE INDEX idx_dialogue ON plato_positions(dialogue);
CREATE INDEX idx_speaker ON plato_positions(speaker);
CREATE INDEX idx_keywords ON plato_positions(keywords);
```

## Dialogues Covered
Apology, Charmides, Critias, Crito, Epistle VII, Euthyphro, Gorgias, Laches, Laws, Parmenides, Phaedrus, Philebus, Protagoras, Republic, Sophist, Statesman, Symposium, Theaetetus, Timaeus

## API Endpoints

### 1. Get All Dialogues
**GET** `/api/plato/dialogues`

Returns a list of all available Plato dialogues in the database.

**Response:**
```json
{
  "success": true,
  "dialogues": ["Apology", "Republic", "Symposium", ...]
}
```

**Example:**
```bash
curl http://localhost:5000/api/plato/dialogues
```

---

### 2. Get All Speakers
**GET** `/api/plato/speakers`

Returns a list of all speakers across all dialogues.

**Response:**
```json
{
  "success": true,
  "speakers": ["Socrates", "Plato", "Diotima", ...]
}
```

**Example:**
```bash
curl http://localhost:5000/api/plato/speakers
```

---

### 3. Search Plato Positions
**POST** `/api/plato/search`

Search for philosophical positions with multiple filter options.

**Request Body:**
```json
{
  "dialogue": "Republic",        // Optional: Filter by dialogue name (max 500 chars)
  "speaker": "Socrates",          // Optional: Filter by speaker (max 500 chars)
  "keyword": "forms",             // Optional: Search in keywords array (max 500 chars)
  "searchText": "immortal",       // Optional: Full-text search in claim + context (max 500 chars)
  "limit": 50                     // Optional: Max results (default: 50, max: 100)
}
```

**Security & Validation:**
- ✅ **Limit cap**: Maximum 100 rows per request (enforced at API and database level)
- ✅ **String validation**: All text inputs limited to 500 characters
- ✅ **SQL injection protection**: LIKE wildcards (%, _, \) properly escaped
- ✅ **Type validation**: All parameters validated for correct type before processing
- ❌ Invalid requests return `400 Bad Request` with descriptive error messages

**Response:**
```json
{
  "success": true,
  "count": 2,
  "positions": [
    {
      "id": "0518",
      "dialogue": "Republic",
      "location": "608d-611a",
      "speaker": "Socrates",
      "claim": "The soul is immortal and has had many incarnations.",
      "context": "Argument from the nature of the soul.",
      "keywords": ["soul", "immortality", "reincarnation"]
    }
  ]
}
```

**Example Queries:**

1. **Search by dialogue:**
```bash
curl -X POST http://localhost:5000/api/plato/search \
  -H "Content-Type: application/json" \
  -d '{"dialogue": "Republic", "limit": 5}'
```

2. **Search by speaker:**
```bash
curl -X POST http://localhost:5000/api/plato/search \
  -H "Content-Type: application/json" \
  -d '{"speaker": "Socrates", "limit": 10}'
```

3. **Search by keyword:**
```bash
curl -X POST http://localhost:5000/api/plato/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "Forms", "limit": 5}'
```

4. **Full-text search:**
```bash
curl -X POST http://localhost:5000/api/plato/search \
  -H "Content-Type: application/json" \
  -d '{"searchText": "immortal soul", "limit": 3}'
```

5. **Combined filters:**
```bash
curl -X POST http://localhost:5000/api/plato/search \
  -H "Content-Type: application/json" \
  -d '{"dialogue": "Republic", "speaker": "Socrates", "keyword": "education", "limit": 5}'
```

---

## Data Management Scripts

### Clean & Validate JSON
```bash
tsx server/clean-plato-json.ts
```
- Extracts positions from source file
- Strips comments and ellipses
- Validates JSON structure
- Outputs: `attached_assets/plato-positions-cleaned.json`

### Ingest into SQLite
```bash
tsx server/ingest-plato-sqlite.ts
```
- Creates SQLite database
- Loads cleaned JSON data
- Creates indexes for performance
- Outputs: `plato-positions.db`

---

## File Structure

```
server/
├── plato-db.ts                  # SQLite database functions
├── clean-plato-json.ts          # JSON cleaning script
├── ingest-plato-sqlite.ts       # Database ingestion script
└── routes.ts                    # API endpoint definitions

attached_assets/
├── Pasted--id-0001-...txt       # Source data file
└── plato-positions-cleaned.json # Cleaned JSON output

plato-positions.db               # SQLite database (44 KB)
```

---

## Sample Data

**Position Example:**
```json
{
  "id": "0513",
  "dialogue": "Republic",
  "location": "514a-520a",
  "speaker": "Socrates",
  "claim": "The Allegory of the Cave: education is turning the soul from shadows to the real.",
  "context": "Central metaphor of the Republic.",
  "keywords": ["cave", "education", "forms", "illusion"]
}
```

---

## Database Functions (TypeScript)

### `initPlatoDatabase()`
Initializes SQLite database with schema and indexes.

### `getPlatoDatabase()`
Returns a connection to the SQLite database.

### `ingestPlatoPositions(jsonPath: string)`
Loads positions from JSON file into database.

### `searchPlatoPositions(query)`
Searches positions with multiple filter options.

### `getAllDialogues()`
Returns array of all dialogue names.

### `getAllSpeakers()`
Returns array of all speaker names.

---

## Next Steps: Expanding the Database

The current database contains **88 positions** extracted from the source file. To expand to the full 2,017 positions:

1. Obtain the complete Plato positions JSON file (currently only sample with placeholders)
2. Run the cleaning script: `tsx server/clean-plato-json.ts`
3. Re-ingest: `tsx server/ingest-plato-sqlite.ts`
4. API will automatically serve the expanded dataset

---

## Testing

All endpoints have been tested and validated:
- ✅ GET `/api/plato/dialogues` - Returns 19 dialogues
- ✅ GET `/api/plato/speakers` - Returns 14 speakers  
- ✅ POST `/api/plato/search` - All filter combinations working
  - ✅ Filter by dialogue
  - ✅ Filter by speaker
  - ✅ Filter by keyword
  - ✅ Full-text search
  - ✅ Combined filters

**System Status**: 🟢 Fully Operational
