/**
 * Test Script for ZHI Knowledge Provider API
 * Demonstrates how EZHW and other ZHI apps should authenticate and query
 * the philosophical knowledge database.
 */

import crypto from 'crypto';

// Configuration
const ZHI_PRIVATE_KEY = process.env.ZHI_PRIVATE_KEY;
const API_URL = process.env.API_URL || 'http://localhost:5000';

if (!ZHI_PRIVATE_KEY) {
  console.error('ERROR: ZHI_PRIVATE_KEY environment variable not set');
  process.exit(1);
}

/**
 * Generate HMAC-SHA256 signature for ZHI internal API requests
 */
function generateZhiSignature(privateKey, method, url, timestamp, nonce, rawBody) {
  const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody) : (rawBody || Buffer.from(''));
  const bodyHash = crypto.createHash('sha256').update(bodyBuffer).digest('hex');
  const payload = `${method}\n${url}\n${timestamp}\n${nonce}\n${bodyHash}`;
  
  return crypto
    .createHmac('sha256', privateKey)
    .update(payload)
    .digest('base64');
}

/**
 * Make authenticated request to ZHI knowledge provider
 */
async function queryKnowledge(requestBody, appId = 'test-client') {
  const method = 'POST';
  const path = '/api/internal/knowledge';
  const url = path; // No query params for POST
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const rawBody = JSON.stringify(requestBody);
  
  const signature = generateZhiSignature(
    ZHI_PRIVATE_KEY,
    method,
    url,
    timestamp,
    nonce,
    rawBody
  );
  
  console.log('\n========================================');
  console.log('AUTHENTICATED REQUEST');
  console.log('========================================');
  console.log('Method:', method);
  console.log('URL:', `${API_URL}${path}`);
  console.log('Timestamp:', timestamp);
  console.log('Nonce:', nonce);
  console.log('Body:', requestBody);
  console.log('Signature:', signature.substring(0, 20) + '...');
  console.log('========================================\n');
  
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-ZHI-App-Id': appId,
        'X-ZHI-Timestamp': timestamp.toString(),
        'X-ZHI-Nonce': nonce,
        'X-ZHI-Signature': signature,
      },
      body: rawBody,
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS');
      console.log('Query:', data.meta.query);
      console.log('Figure:', data.meta.figureId);
      console.log('Results:', data.meta.resultsReturned);
      console.log('Characters:', data.meta.totalCharacters);
      console.log('Quotes:', data.meta.quotesExtracted);
      
      if (data.passages && data.passages.length > 0) {
        console.log('\n--- PASSAGE SAMPLE ---');
        const sample = data.passages[0];
        console.log('Author:', sample.author);
        console.log('Title:', sample.paperTitle);
        console.log('Source:', sample.source);
        console.log('Distance:', sample.semanticDistance.toFixed(4));
        console.log('Content (first 200 chars):', sample.content.substring(0, 200) + '...');
      }
      
      if (data.quotes && data.quotes.length > 0) {
        console.log('\n--- QUOTE SAMPLE ---');
        console.log('"' + data.quotes[0].text + '"');
        console.log('Source:', data.quotes[0].source);
      }
    } else {
      console.log('\n❌ ERROR');
      console.log('Error:', data.error);
      if (data.details) console.log('Details:', data.details);
      if (data.message) console.log('Message:', data.message);
    }
    
    return data;
    
  } catch (error) {
    console.error('\n❌ NETWORK ERROR');
    console.error(error.message);
    throw error;
  }
}

/**
 * Test unauthorized request (should fail)
 */
async function testUnauthorized() {
  console.log('\n========================================');
  console.log('TEST: UNAUTHORIZED REQUEST');
  console.log('========================================\n');
  
  try {
    const response = await fetch(`${API_URL}/api/internal/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'test' }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Expected: 401 Unauthorized');
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected unauthorized request\n');
    } else {
      console.log('❌ Should have rejected unauthorized request\n');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

/**
 * Test invalid signature (should fail)
 */
async function testInvalidSignature() {
  console.log('\n========================================');
  console.log('TEST: INVALID SIGNATURE');
  console.log('========================================\n');
  
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  try {
    const response = await fetch(`${API_URL}/api/internal/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ZHI-App-Id': 'test-client',
        'X-ZHI-Timestamp': timestamp.toString(),
        'X-ZHI-Nonce': nonce,
        'X-ZHI-Signature': 'invalid-signature',
      },
      body: JSON.stringify({ query: 'test' }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Expected: 401 Unauthorized');
    console.log('Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid signature\n');
    } else {
      console.log('❌ Should have rejected invalid signature\n');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run tests
(async () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  ZHI KNOWLEDGE PROVIDER API TESTS     ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Test 1: Unauthorized request
  await testUnauthorized();
  
  // Test 2: Invalid signature
  await testInvalidSignature();
  
  // Test 3: Valid request - Freud on psychoanalysis
  console.log('\n========================================');
  console.log('TEST: VALID REQUEST - Freud');
  console.log('========================================');
  await queryKnowledge({
    query: 'What is the unconscious mind?',
    figureId: 'freud',
    maxResults: 3,
    includeQuotes: true,
    minQuoteLength: 50
  }, 'ezhw-app');
  
  // Test 4: Valid request - Kuczynski on psychopathy
  console.log('\n\n========================================');
  console.log('TEST: VALID REQUEST - Kuczynski');
  console.log('========================================');
  await queryKnowledge({
    query: 'What is psychopathy and how does it relate to values?',
    figureId: 'jmk',
    maxResults: 5,
    includeQuotes: true,
    maxCharacters: 5000
  }, 'ezhw-app');
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          TESTS COMPLETED              ║');
  console.log('╚════════════════════════════════════════╝\n');
})();
