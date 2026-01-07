# ZHI Query API Documentation

## Endpoint
```
POST https://homeoworkhelper3000.onrender.com/zhi/query
```

## Purpose
Secure internal API for ZHI ecosystem applications to query the unified philosophical knowledge base containing works from 44+ philosophers and literary figures.

## Authentication
Uses HMAC-SHA256 signature authentication with shared `ZHI_PRIVATE_KEY`.

### Required Headers
```
X-ZHI-App-Id: <your_app_identifier>
X-ZHI-Timestamp: <unix_timestamp_milliseconds>
X-ZHI-Nonce: <unique_random_string>
X-ZHI-Signature: <base64_hmac_sha256_signature>
```

### Signature Generation
```javascript
const crypto = require('crypto');

function generateSignature(privateKey, method, url, timestamp, nonce, body) {
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const payload = `${method}\n${url}\n${timestamp}\n${nonce}\n${bodyHash}`;
  return crypto.createHmac('sha256', privateKey).update(payload).digest('base64');
}

// Example usage
const method = 'POST';
const url = '/zhi/query';
const timestamp = Date.now();
const nonce = crypto.randomBytes(16).toString('hex');
const body = JSON.stringify({ query: 'psychoanalysis', limit: 5 });

const signature = generateSignature(
  process.env.ZHI_PRIVATE_KEY,
  method,
  url,
  timestamp,
  nonce,
  body
);
```

## Request Body

### Parameters
```typescript
{
  query?: string,           // Natural language search query (1-1000 chars)
  author?: string,          // Filter by author/philosopher name
  work?: string,            // Filter by specific work/paper title
  keywords?: string[],      // Array of keywords to search
  limit?: number,           // Max results to return (1-50, default: 10)
  includeQuotes?: boolean,  // Extract relevant quotes (default: false)
  minQuoteLength?: number   // Minimum quote length (10-200, default: 50)
}
```

**Note**: Must provide at least one of: `query`, `author`, `work`, or `keywords`

### Example Requests

#### 1. Simple Query
```json
{
  "query": "What is the unconscious mind?",
  "limit": 5,
  "includeQuotes": true
}
```

#### 2. Filter by Author
```json
{
  "query": "psychoanalysis",
  "author": "Freud",
  "limit": 10
}
```

#### 3. Keyword Search
```json
{
  "keywords": ["psychopathy", "values", "consciousness"],
  "author": "Kuczynski",
  "limit": 8,
  "includeQuotes": true
}
```

#### 4. Specific Work
```json
{
  "work": "A General Introduction to Psychoanalysis",
  "query": "dreams",
  "limit": 3
}
```

## Response Format

### Success Response (200)
```typescript
{
  results: Array<{
    excerpt: string,          // The text passage
    citation: {
      author: string,         // Author name
      work: string,           // Full work title
      chunkIndex: number      // Chunk position in source
    },
    relevance: number,        // Relevance score (0-1)
    tokens: number            // Estimated token count
  }>,
  quotes: Array<{
    text: string,             // The extracted quote
    citation: {
      work: string,           // Source work
      chunkIndex: number      // Chunk position
    }
  }>,
  meta: {
    resultsReturned: number,  // Number of results
    limitApplied: number,     // Limit used
    queryProcessed: string,   // Processed search query
    filters: {
      author: string | null,
      work: string | null,
      keywords: string[] | null
    },
    timestamp: number         // Response timestamp
  }
}
```

### Example Response
```json
{
  "results": [
    {
      "excerpt": "psychoanalysis. It is not the sexual life alone, but every interest and every motive...",
      "citation": {
        "author": "The Complete Works of Sigmund Freud",
        "work": "The Complete Works of Sigmund Freud",
        "chunkIndex": 42
      },
      "relevance": 0.8732,
      "tokens": 325
    }
  ],
  "quotes": [
    {
      "text": "The unconscious is the true psychical reality",
      "citation": {
        "work": "A General Introduction to Psychoanalysis",
        "chunkIndex": 15
      }
    }
  ],
  "meta": {
    "resultsReturned": 5,
    "limitApplied": 5,
    "queryProcessed": "What is the unconscious mind?",
    "filters": {
      "author": null,
      "work": null,
      "keywords": null
    },
    "timestamp": 1762874506828
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid request format",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["query"]
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Missing required authentication headers",
  "required": ["X-ZHI-App-Id", "X-ZHI-Timestamp", "X-ZHI-Nonce", "X-ZHI-Signature"]
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Vector search error: ..."
}
```

## Complete Example (Node.js)

```javascript
const crypto = require('crypto');

const ZHI_PRIVATE_KEY = process.env.ZHI_PRIVATE_KEY;
const API_URL = 'https://homeoworkhelper3000.onrender.com';

async function queryZHI(requestBody, appId = 'my-app') {
  const method = 'POST';
  const url = '/zhi/query';
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const body = JSON.stringify(requestBody);
  
  // Generate signature
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  const payload = `${method}\n${url}\n${timestamp}\n${nonce}\n${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', ZHI_PRIVATE_KEY)
    .update(payload)
    .digest('base64');
  
  // Make request
  const response = await fetch(`${API_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-ZHI-App-Id': appId,
      'X-ZHI-Timestamp': timestamp.toString(),
      'X-ZHI-Nonce': nonce,
      'X-ZHI-Signature': signature,
    },
    body,
  });
  
  return response.json();
}

// Example usage
(async () => {
  const result = await queryZHI({
    query: 'What is psychoanalysis?',
    author: 'Freud',
    limit: 5,
    includeQuotes: true
  });
  
  console.log('Results:', result.results.length);
  console.log('First result:', result.results[0].excerpt.substring(0, 200));
})();
```

## Knowledge Base Contents

The unified knowledge base contains **25,697 text chunks** across **171 philosophical and literary works** from 44+ figures including:

- **Philosophy**: Kuczynski, Russell, Hegel, Dewey, Peirce, Descartes, Leibniz, Mill, Spencer
- **Psychoanalysis**: Freud, Adler
- **Economics**: Veblen, Mises, Smith, Lenin, Engels
- **Psychology**: William James
- **Science**: Newton, Darwin, Poincaré, Einstein
- **Literature**: Poe, Defoe, Tacitus
- **And many more...**

All texts are semantically indexed using OpenAI embeddings for accurate retrieval.

## Security Notes

- **Never expose `ZHI_PRIVATE_KEY`** - keep it secret in environment variables
- Signatures expire after 60 seconds (timestamp validation)
- Nonces are checked for replay attack prevention
- All requests are logged with app ID for audit trail
- Use HTTPS in production (Render provides SSL)

## Rate Limiting

Currently no rate limiting implemented. Consider implementing client-side throttling for production use.

## Support

For issues or questions about the ZHI Query API, contact the ZHI ecosystem maintainer.
