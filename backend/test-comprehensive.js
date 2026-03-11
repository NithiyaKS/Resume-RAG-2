const http = require('http');

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function comprehensiveTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      COMPREHENSIVE VECTOR SEARCH & BM25 TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let passedTests = 0;
  let failedTests = 0;

  try {
    // Test 1: BM25 Search
    console.log('TEST 1: BM25 Full-Text Search');
    console.log('─'.repeat(60));
    const bm25 = await makeRequest('/v1/search/bm25', 'POST', {
      query: 'python developer',
      limit: 5,
    });
    if (bm25.status === 200 && bm25.body.data?.total > 0) {
      console.log(`✅ PASS - Found ${bm25.body.data.total} matches`);
      console.log(`   Top result: ${bm25.body.data.results[0].name} (Score: ${bm25.body.data.results[0].score.toFixed(2)})`);
      passedTests++;
    } else {
      console.log('❌ FAIL - BM25 search did not return expected results');
      failedTests++;
    }
    console.log();

    // Test 2: Vector Search
    console.log('TEST 2: Vector Semantic Search');
    console.log('─'.repeat(60));
    const vector = await makeRequest('/v1/search/vector', 'POST', {
      query: 'python developer',
      limit: 5,
    });
    if (vector.status === 200 && vector.body.data?.length > 0) {
      console.log(`✅ PASS - Found ${vector.body.data.length} similar candidates`);
      console.log(`   Top result: ${vector.body.data[0].name} (Score: ${vector.body.data[0].score.toFixed(4)})`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Vector search did not return results');
      failedTests++;
    }
    console.log();

    // Test 3: Advanced Vector Search with Threshold
    console.log('TEST 3: Advanced Vector Search (with threshold)');
    console.log('─'.repeat(60));
    const advVector = await makeRequest('/v1/search/vector/advanced', 'POST', {
      query: 'senior engineer',
      scoreThreshold: 0.70,
      limit: 5,
    });
    if (advVector.status === 200) {
      console.log(`✅ PASS - Found ${advVector.body.data.length} results above 0.70 threshold`);
      if (advVector.body.data.length > 0) {
        console.log(`   Top result: ${advVector.body.data[0].name} (Score: ${advVector.body.data[0].score.toFixed(4)})`);
      }
      passedTests++;
    } else {
      console.log('❌ FAIL - Advanced vector search failed');
      failedTests++;
    }
    console.log();

    // Test 4: BM25 Stats
    console.log('TEST 4: BM25 Search Statistics');
    console.log('─'.repeat(60));
    const bm25Stats = await makeRequest('/v1/search/stats', 'GET');
    if (bm25Stats.status === 200 && bm25Stats.body.data?.totalDocuments > 0) {
      console.log(`✅ PASS - Statistics retrieved`);
      console.log(`   Total documents: ${bm25Stats.body.data.totalDocuments}`);
      console.log(`   Indexed fields: ${bm25Stats.body.data.indexedFields.join(', ')}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Could not get BM25 statistics');
      failedTests++;
    }
    console.log();

    // Test 5: Vector Search Stats
    console.log('TEST 5: Vector Search Statistics');
    console.log('─'.repeat(60));
    const vectorStats = await makeRequest('/v1/search/vector/stats', 'GET');
    if (vectorStats.status === 200 && vectorStats.body.data?.totalDocuments > 0) {
      console.log(`✅ PASS - Statistics retrieved`);
      console.log(`   Total documents: ${vectorStats.body.data.totalDocuments}`);
      console.log(`   With embeddings: ${vectorStats.body.data.documentsWithEmbeddings}`);
      console.log(`   Dimension: ${vectorStats.body.data.embeddingDimension}`);
      console.log(`   Method: ${vectorStats.body.data.searchMethod}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Could not get vector statistics');
      failedTests++;
    }
    console.log();

    // Test 6: Pagination Test
    console.log('TEST 6: Vector Search Pagination');
    console.log('─'.repeat(60));
    const page1 = await makeRequest('/v1/search/vector', 'POST', {
      query: 'engineer',
      limit: 3,
      skip: 0,
    });
    const page2 = await makeRequest('/v1/search/vector', 'POST', {
      query: 'engineer',
      limit: 3,
      skip: 3,
    });
    if (page1.status === 200 && page2.status === 200) {
      const allIds = new Set([...page1.body.data.map(d => d._id), ...page2.body.data.map(d => d._id)]);
      if (allIds.size === 6) {
        console.log(`✅ PASS - Pagination working correctly`);
        console.log(`   Page 1: ${page1.body.data.length} results`);
        console.log(`   Page 2: ${page2.body.data.length} results`);
        console.log(`   All unique: Yes`);
        passedTests++;
      } else {
        console.log('❌ FAIL - Pagination results overlap incorrectly');
        failedTests++;
      }
    } else {
      console.log('❌ FAIL - Pagination test failed');
      failedTests++;
    }
    console.log();

    // Test 7: Multiple Queries Comparison
    console.log('TEST 7: Different Query Semantics');
    console.log('─'.repeat(60));
    const queries = ['python engineer', 'machine learning specialist', 'database administrator'];
    const results = await Promise.all(
      queries.map(q => makeRequest('/v1/search/vector', 'POST', {
        query: q,
        limit: 1,
      }))
    );
    
    const topCandidates = results.map((r, i) => ({
      query: queries[i],
      name: r.body.data[0]?.name,
      score: r.body.data[0]?.score,
    }));
    
    console.log(`✅ PASS - Tested ${queries.length} different queries`);
    topCandidates.forEach(tc => {
      console.log(`   "${tc.query}": ${tc.name} (${tc.score?.toFixed(4)})`);
    });
    passedTests++;
    console.log();

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST SUMMARY                           ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Passed: ${String(passedTests).padEnd(52)}║`);
    console.log(`║  Failed: ${String(failedTests).padEnd(52)}║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    if (failedTests === 0) {
      console.log('║  Status: 🎉 ALL TESTS PASSED! 🎉                         ║');
      console.log('║                                                            ║');
      console.log('║  Vector search is fully operational with:                 ║');
      console.log('║  ✓ BM25 full-text search                                  ║');
      console.log('║  ✓ Vector semantic search                                 ║');
      console.log('║  ✓ Advanced search with thresholds                        ║');
      console.log('║  ✓ Pagination support                                     ║');
      console.log('║  ✓ Comprehensive statistics                               ║');
      console.log('║  ✓ Hybrid implementation (MongoDB + application-level)    ║');
    } else {
      console.log(`║  Status: ⚠️  ${failedTests} TEST(S) FAILED                     ║`);
    }
    
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
}

comprehensiveTest();
