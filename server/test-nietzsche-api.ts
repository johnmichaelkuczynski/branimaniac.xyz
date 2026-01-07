const API_BASE = 'http://localhost:5000/api/nietzsche';

async function testNietzscheAPI() {
  console.log('\n🧪 NIETZSCHE DATABASE & API TEST SUITE\n');
  console.log('='.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Get all works
  try {
    console.log('\nTEST 1: Get all works');
    const res = await fetch(`${API_BASE}/works`);
    const data = await res.json();
    if (data.success && data.works.length > 0) {
      console.log(`✅ PASS: Retrieved ${data.works.length} works`);
      console.log(`   Samples: ${data.works.slice(0, 3).join(', ')}...`);
      passed++;
    } else {
      console.log('❌ FAIL: No works returned');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  // Test 2: Get all years
  try {
    console.log('\nTEST 2: Get all years');
    const res = await fetch(`${API_BASE}/years`);
    const data = await res.json();
    if (data.success && data.years.length > 0) {
      console.log(`✅ PASS: Retrieved ${data.years.length} years`);
      console.log(`   Range: ${data.years[0]} to ${data.years[data.years.length - 1]}`);
      passed++;
    } else {
      console.log('❌ FAIL: No years returned');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  // Test 3: Get database stats
  try {
    console.log('\nTEST 3: Get database stats');
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    if (data.success && data.stats.totalPositions > 0) {
      console.log(`✅ PASS: Database has ${data.stats.totalPositions} positions`);
      console.log(`   Works: ${data.stats.works}, Years: ${data.stats.years}`);
      passed++;
    } else {
      console.log('❌ FAIL: Invalid stats');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  // Test 4: Search by work
  try {
    console.log('\nTEST 4: Search by work (Beyond Good and Evil)');
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work: 'Beyond Good and Evil', limit: 5 })
    });
    const data = await res.json();
    if (data.success && data.count > 0) {
      console.log(`✅ PASS: Found ${data.count} positions`);
      console.log(`   Sample: "${data.positions[0].text.substring(0, 60)}..."`);
      passed++;
    } else {
      console.log('❌ FAIL: No positions found');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  // Test 5: Search by year
  try {
    console.log('\nTEST 5: Search by year (1888)');
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 1888, limit: 5 })
    });
    const data = await res.json();
    if (data.success && data.count > 0) {
      console.log(`✅ PASS: Found ${data.count} positions from 1888`);
      console.log(`   Sample work: ${data.positions[0].work}`);
      passed++;
    } else {
      console.log('❌ FAIL: No positions found');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  // Test 6: Search by keyword
  try {
    console.log('\nTEST 6: Search by keyword (will-to-power)');
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'will-to-power', limit: 5 })
    });
    const data = await res.json();
    if (data.success && data.count > 0) {
      console.log(`✅ PASS: Found ${data.count} positions with keyword`);
      console.log(`   Tags: ${JSON.stringify(data.positions[0].tags)}`);
      passed++;
    } else {
      console.log('❌ FAIL: No positions found');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  // Test 7: Full-text search
  try {
    console.log('\nTEST 7: Full-text search (overman)');
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchText: 'overman', limit: 5 })
    });
    const data = await res.json();
    if (data.success && data.count > 0) {
      console.log(`✅ PASS: Found ${data.count} positions with "overman"`);
      console.log(`   Sample: "${data.positions[0].text.substring(0, 60)}..."`);
      passed++;
    } else {
      console.log('❌ FAIL: No positions found');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    failed++;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Passed: ${passed}/7`);
  console.log(`   ❌ Failed: ${failed}/7`);
  console.log(`   Success Rate: ${((passed / 7) * 100).toFixed(1)}%`);
  
  if (passed === 7) {
    console.log('\n🎉 ALL TESTS PASSED! Nietzsche database & API fully operational.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}

testNietzscheAPI();
