# Nietzsche SQLite Database & API

Complete SQLite database system for querying Friedrich Nietzsche's philosophical positions with secure REST API endpoints.

## 📊 Database Statistics

- **Total Positions**: 706
- **Unique Works**: 16
- **Year Range**: 13 distinct years (1872-1888)
- **Database File**: `nietzsche-positions.db` (SQLite)

## 📚 Works Included

| Work | Positions |
|------|-----------|
| The Will to Power | 150 |
| The Antichrist | 93 |
| Beyond Good and Evil | 92 |
| Thus Spoke Zarathustra | 91 |
| Twilight of the Idols | 86 |
| Ecce Homo | 55 |
| Human, All Too Human I | 47 |
| On the Genealogy of Morality | 41 |
| The Gay Science | 18 |
| The Birth of Tragedy | 12 |
| Human, All Too Human II | 7 |
| The Dawn | 5 |
| The Case of Wagner | 4 |
| Nietzsche contra Wagner | 2 |
| Untimely Meditations | 2 |
| Nachlass | 1 |

## 🔌 API Endpoints

### Get All Works

**GET** `/api/nietzsche/works`

Returns a list of all unique works in the database.

**Response:**
```json
{
  "success": true,
  "works": [
    "Beyond Good and Evil",
    "Ecce Homo",
    "Human, All Too Human I",
    ...
  ]
}
```

---

### Get All Years

**GET** `/api/nietzsche/years`

Returns a list of all publication years.

**Response:**
```json
{
  "success": true,
  "years": [1872, 1878, 1879, 1880, 1881, 1882, 1883, 1884, 1885, 1886, 1887, 1888]
}
```

---

### Get Database Stats

**GET** `/api/nietzsche/stats`

Returns database statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPositions": 706,
    "works": 16,
    "years": 13
  }
}
```

---

### Search Positions

**POST** `/api/nietzsche/search`

Search for philosophical positions with multiple filter options.

**Request Body:**
```json
{
  "work": "Beyond Good and Evil",    // Optional: Filter by work title (max 500 chars)
  "year": 1888,                       // Optional: Filter by publication year (1800-1900)
  "keyword": "will-to-power",         // Optional: Search in tags array (max 500 chars)
  "searchText": "overman",            // Optional: Full-text search in text + section (max 500 chars)
  "limit": 50                         // Optional: Max results (default: 50, max: 100)
}
```

**Security & Validation:**
- ✅ **Limit cap**: Maximum 100 rows per request (enforced at API and database level)
- ✅ **String validation**: All text inputs limited to 500 characters
- ✅ **SQL injection protection**: LIKE wildcards (%, _, \) properly escaped
- ✅ **Type validation**: All parameters validated for correct type before processing
- ✅ **Year range**: 1800-1900 enforced for year parameter
- ❌ Invalid requests return `400 Bad Request` with descriptive error messages

**Response:**
```json
{
  "success": true,
  "count": 5,
  "positions": [
    {
      "id": 8,
      "text": "Man is a rope, tied between beast and overman — a rope over an abyss.",
      "work": "Thus Spoke Zarathustra",
      "section": "Prologue §4",
      "year": 1883,
      "tags": ["transition", "danger", "overman"]
    },
    ...
  ]
}
```

---

## 🔒 Security Features

All endpoints implement production-grade security:

1. **SQL Injection Prevention**: All LIKE wildcards escaped, prepared statements used
2. **DoS Protection**: Hard limit of 100 rows per request
3. **Input Validation**: Type checking, length limits, range validation
4. **Error Handling**: Descriptive errors without exposing internals

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
tsx server/test-nietzsche-api.ts
```

**Tests Include:**
1. Get all works
2. Get all years
3. Get database stats
4. Search by work (Beyond Good and Evil)
5. Search by year (1888)
6. Search by keyword (will-to-power)
7. Full-text search (overman)

---

## 📁 File Structure

```
├── nietzsche-positions.db                        # SQLite database (generated)
├── server/
│   ├── nietzsche-db.ts                          # Database functions & queries
│   ├── routes.ts                                # API endpoint handlers (lines 3149-3246)
│   ├── clean-nietzsche-json.ts                  # JSON cleaning script
│   ├── ingest-nietzsche-sqlite.ts               # Database ingestion script
│   └── test-nietzsche-api.ts                    # API test suite
└── attached_assets/
    └── nietzsche-positions-cleaned.json         # Cleaned source data (706 positions)
```

---

## 🚀 Usage Examples

### Command Line

```bash
# Get all works
curl http://localhost:5000/api/nietzsche/works

# Search for positions about the will to power
curl -X POST http://localhost:5000/api/nietzsche/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "will-to-power", "limit": 10}'

# Search by work and year
curl -X POST http://localhost:5000/api/nietzsche/search \
  -H "Content-Type: application/json" \
  -d '{"work": "Beyond Good and Evil", "year": 1886, "limit": 5}'
```

### JavaScript/TypeScript

```typescript
// Get database stats
const statsRes = await fetch('http://localhost:5000/api/nietzsche/stats');
const stats = await statsRes.json();
console.log(`Database has ${stats.stats.totalPositions} positions`);

// Search for positions
const searchRes = await fetch('http://localhost:5000/api/nietzsche/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    searchText: 'God is dead',
    limit: 5
  })
});
const results = await searchRes.json();
console.log(`Found ${results.count} positions`);
```

---

## 🔄 Rebuilding the Database

If you need to rebuild from source:

```bash
# 1. Clean the JSON data
tsx server/clean-nietzsche-json.ts

# 2. Ingest into SQLite
tsx server/ingest-nietzsche-sqlite.ts

# 3. Test the API
tsx server/test-nietzsche-api.ts
```

---

## 📈 Expansion

To expand the database with additional positions:

1. Add new entries to `attached_assets/nietzsche-positions-cleaned.json`
2. Run `tsx server/ingest-nietzsche-sqlite.ts` (uses `INSERT OR REPLACE`)
3. API automatically serves the updated dataset

---

**Status**: ✅ Production-ready and fully tested
