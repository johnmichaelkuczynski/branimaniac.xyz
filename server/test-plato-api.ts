/**
 * Comprehensive test suite for Plato SQLite Database & API
 * Tests all endpoints and validates data integrity
 */

async function testPlatoAPI() {
  console.log('🧪 PLATO DATABASE & API TEST SUITE\n');
  console.log('=' .repeat(70) + '\n');
  
  const baseUrl = 'http://localhost:5000';
  let testsPasssed = 0;
  let testsFailed = 0;
  
  // Test 1: GET /api/plato/dialogues
  console.log('TEST 1: Get all dialogues');
  try {
    const response = await fetch(`${baseUrl}/api/plato/dialogues`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.dialogues) && data.dialogues.length === 19) {
      console.log(`✅ PASS: Retrieved ${data.dialogues.length} dialogues`);
      console.log(`   Samples: ${data.dialogues.slice(0, 3).join(', ')}...\n`);
      testsPasssed++;
    } else {
      console.log(`❌ FAIL: Expected 19 dialogues, got ${data.dialogues?.length}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Test 2: GET /api/plato/speakers
  console.log('TEST 2: Get all speakers');
  try {
    const response = await fetch(`${baseUrl}/api/plato/speakers`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.speakers) && data.speakers.length === 14) {
      console.log(`✅ PASS: Retrieved ${data.speakers.length} speakers`);
      console.log(`   Samples: ${data.speakers.slice(0, 3).join(', ')}...\n`);
      testsPasssed++;
    } else {
      console.log(`❌ FAIL: Expected 14 speakers, got ${data.speakers?.length}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Test 3: Search by dialogue
  console.log('TEST 3: Search by dialogue (Republic)');
  try {
    const response = await fetch(`${baseUrl}/api/plato/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogue: 'Republic', limit: 3 })
    });
    const data = await response.json();
    
    if (data.success && data.count > 0 && data.positions.every((p: any) => p.dialogue === 'Republic')) {
      console.log(`✅ PASS: Found ${data.count} Republic positions`);
      console.log(`   Sample: "${data.positions[0].claim.substring(0, 60)}..."\n`);
      testsPasssed++;
    } else {
      console.log(`❌ FAIL: Search returned invalid results\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Test 4: Search by speaker
  console.log('TEST 4: Search by speaker (Socrates)');
  try {
    const response = await fetch(`${baseUrl}/api/plato/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'Socrates', limit: 5 })
    });
    const data = await response.json();
    
    if (data.success && data.count > 0 && data.positions.every((p: any) => p.speaker === 'Socrates')) {
      console.log(`✅ PASS: Found ${data.count} Socrates positions`);
      console.log(`   Sample: "${data.positions[0].claim.substring(0, 60)}..."\n`);
      testsPasssed++;
    } else {
      console.log(`❌ FAIL: Search returned invalid results\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Test 5: Search by keyword
  console.log('TEST 5: Search by keyword (forms)');
  try {
    const response = await fetch(`${baseUrl}/api/plato/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'forms', limit: 3 })
    });
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      console.log(`✅ PASS: Found ${data.count} positions with keyword "forms"`);
      console.log(`   Keywords: ${JSON.stringify(data.positions[0].keywords)}\n`);
      testsPasssed++;
    } else {
      console.log(`❌ FAIL: Search returned no results\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Test 6: Full-text search
  console.log('TEST 6: Full-text search (immortal)');
  try {
    const response = await fetch(`${baseUrl}/api/plato/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchText: 'immortal', limit: 2 })
    });
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      const hasKeyword = data.positions.some((p: any) => 
        p.claim.toLowerCase().includes('immortal') || p.context.toLowerCase().includes('immortal')
      );
      
      if (hasKeyword) {
        console.log(`✅ PASS: Found ${data.count} positions with "immortal"`);
        console.log(`   Sample: "${data.positions[0].claim.substring(0, 60)}..."\n`);
        testsPasssed++;
      } else {
        console.log(`❌ FAIL: Results don't contain search term\n`);
        testsFailed++;
      }
    } else {
      console.log(`❌ FAIL: Search returned no results\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Test 7: Combined filters
  console.log('TEST 7: Combined filters (Republic + Socrates)');
  try {
    const response = await fetch(`${baseUrl}/api/plato/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogue: 'Republic', speaker: 'Socrates', limit: 5 })
    });
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      const allMatch = data.positions.every((p: any) => 
        p.dialogue === 'Republic' && p.speaker === 'Socrates'
      );
      
      if (allMatch) {
        console.log(`✅ PASS: Found ${data.count} Republic positions by Socrates`);
        console.log(`   Sample: "${data.positions[0].claim.substring(0, 60)}..."\n`);
        testsPasssed++;
      } else {
        console.log(`❌ FAIL: Results don't match all filters\n`);
        testsFailed++;
      }
    } else {
      console.log(`❌ FAIL: Search returned no results\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error}\n`);
    testsFailed++;
  }
  
  // Summary
  console.log('=' .repeat(70));
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Passed: ${testsPasssed}/7`);
  console.log(`   ❌ Failed: ${testsFailed}/7`);
  console.log(`   Success Rate: ${((testsPasssed / 7) * 100).toFixed(1)}%\n`);
  
  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Plato database & API fully operational.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review errors above.\n');
    process.exit(1);
  }
}

testPlatoAPI().catch(console.error);
