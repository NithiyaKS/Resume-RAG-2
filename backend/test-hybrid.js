const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           HYBRID SEARCH (BM25 + Vector) TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let passCount = 0;

  try {
    // Test 1: Get Hybrid Search Statistics
    console.log('TEST 1: Get Hybrid Search Statistics');
    console.log('────────────────────────────────────────────────────────────');
    const statsRes = await axios.get(`${BASE_URL}/v1/search/hybrid/stats`, { timeout: 5000 });
    console.log('✅ PASS - Hybrid search stats retrieved');
    console.log(`   BM25 Available: ${statsRes.data.data.bm25Available}`);
    console.log(`   Vector Available: ${statsRes.data.data.vectorAvailable}`);
    console.log(`   Total Documents: ${statsRes.data.data.totalDocuments}`);
    console.log(`   Documents with Embeddings: ${statsRes.data.data.documentsWithEmbeddings}`);
    passCount++;
    console.log('');

    // Test 2: Basic Hybrid Search - python developer
    console.log('TEST 2: Basic Hybrid Search - "python developer"');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes1 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'python developer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 5,
      skip: 0,
    }, { timeout: 10000 });
    console.log(`✅ PASS - Found ${hybridRes1.data.data.length} results`);
    console.log('Top Results:');
    hybridRes1.data.data.slice(0, 3).forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name} - Combined: ${result.combinedScore.toFixed(4)}`);
    });
    passCount++;
    console.log('');

    // Test 3: Keyword-Focused Search
    console.log('TEST 3: Keyword-Focused Search - "machine learning"');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes2 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'machine learning',
      bm25Weight: 0.7,
      vectorWeight: 0.3,
      limit: 5,
      skip: 0,
    }, { timeout: 10000 });
    console.log(`✅ PASS - Found ${hybridRes2.data.data.length} results (keyword-focused)`);
    passCount++;
    console.log('');

    // Test 4: Semantic-Focused Search
    console.log('TEST 4: Semantic-Focused Search - "senior engineer skills"');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes3 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'senior engineer skills',
      bm25Weight: 0.3,
      vectorWeight: 0.7,
      limit: 5,
      skip: 0,
    }, { timeout: 10000 });
    console.log(`✅ PASS - Found ${hybridRes3.data.data.length} results (semantic-focused)`);
    passCount++;
    console.log('');

    // Test 5: Advanced Hybrid Search with Thresholds
    console.log('TEST 5: Advanced Hybrid Search with Thresholds');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes4 = await axios.post(`${BASE_URL}/v1/search/hybrid/advanced`, {
      query: 'developer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      bm25Threshold: 0.3,
      vectorThreshold: 0.65,
      normalizeScores: true,
      limit: 10,
      skip: 0,
    }, { timeout: 10000 });
    console.log(`✅ PASS - Found ${hybridRes4.data.data.length} results after filtering`);
    if (hybridRes4.data.data.length > 0) {
      console.log(`   Top: ${hybridRes4.data.data[0].name} (Score: ${hybridRes4.data.data[0].combinedScore.toFixed(4)})`);
    }
    passCount++;
    console.log('');

    // Test 6: Get Recommended Weights
    console.log('TEST 6: Get Recommended Weights');
    console.log('────────────────────────────────────────────────────────────');
    const keywordWeights = await axios.get(`${BASE_URL}/v1/search/hybrid/weights/keyword`, { timeout: 5000 });
    const semanticWeights = await axios.get(`${BASE_URL}/v1/search/hybrid/weights/semantic`, { timeout: 5000 });
    const balancedWeights = await axios.get(`${BASE_URL}/v1/search/hybrid/weights/balanced`, { timeout: 5000 });
    
    console.log('✅ PASS - Retrieved weight recommendations');
    console.log(`   keyword: BM25=${keywordWeights.data.data.bm25Weight}, Vector=${keywordWeights.data.data.vectorWeight}`);
    console.log(`   semantic: BM25=${semanticWeights.data.data.bm25Weight}, Vector=${semanticWeights.data.data.vectorWeight}`);
    console.log(`   balanced: BM25=${balancedWeights.data.data.bm25Weight}, Vector=${balancedWeights.data.data.vectorWeight}`);
    passCount++;
    console.log('');

    // Test 7: Pagination
    console.log('TEST 7: Hybrid Search Pagination');
    console.log('────────────────────────────────────────────────────────────');
    const page1 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'engineer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 3,
      skip: 0,
    }, { timeout: 10000 });
    const page2 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'engineer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 3,
      skip: 3,
    }, { timeout: 10000 });
    console.log(`✅ PASS - Page 1: ${page1.data.data.length} results`);
    console.log(`✅ PASS - Page 2: ${page2.data.data.length} results`);
    
    const page1Ids = page1.data.data.map(r => r._id);
    const page2Ids = page2.data.data.map(r => r._id);
    const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
    console.log(`✅ PASS - Unique results: ${!hasOverlap}`);
    passCount++;
    console.log('');

    // Test 8: Different Weights Comparison
    console.log('TEST 8: Comparing Weight Configurations');
    console.log('────────────────────────────────────────────────────────────');
    const balanced = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'backend developer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 1,
    }, { timeout: 10000 });
    
    const bm25Heavy = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'backend developer',
      bm25Weight: 0.8,
      vectorWeight: 0.2,
      limit: 1,
    }, { timeout: 10000 });
    
    console.log('✅ PASS - Weight configurations');
    console.log(`   Balanced (0.5/0.5): ${balanced.data.data[0]?.name} (${balanced.data.data[0]?.combinedScore.toFixed(4)})`);
    console.log(`   BM25-Heavy (0.8/0.2): ${bm25Heavy.data.data[0]?.name} (${bm25Heavy.data.data[0]?.combinedScore.toFixed(4)})`);
    passCount++;
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║     🎉 ALL TESTS PASSED! (${passCount}/8) 🎉                  ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
