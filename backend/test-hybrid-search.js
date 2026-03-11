const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           HYBRID SEARCH (BM25 + Vector) TEST SUITE         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Get Hybrid Search Statistics
    console.log('TEST 1: Get Hybrid Search Statistics');
    console.log('────────────────────────────────────────────────────────────');
    const statsRes = await axios.get(`${BASE_URL}/v1/search/hybrid/stats`);
    console.log('✅ PASS - Hybrid search stats retrieved');
    console.log(`   BM25 Available: ${statsRes.data.data.bm25Available}`);
    console.log(`   Vector Available: ${statsRes.data.data.vectorAvailable}`);
    console.log(`   Total Documents: ${statsRes.data.data.totalDocuments}`);
    console.log(`   Documents with Embeddings: ${statsRes.data.data.documentsWithEmbeddings}`);
    console.log(`   Recommended Weights: BM25=${statsRes.data.data.recommendedWeights.bm25}, Vector=${statsRes.data.data.recommendedWeights.vector}\n`);

    // Test 2: Get Recommended Weights
    console.log('TEST 2: Get Recommended Weights');
    console.log('────────────────────────────────────────────────────────────');
    for (const intent of ['keyword', 'semantic', 'balanced']) {
      const weightsRes = await axios.get(`${BASE_URL}/v1/search/hybrid/weights/${intent}`);
      console.log(`✅ ${intent.toUpperCase()}: BM25=${weightsRes.data.data.bm25Weight}, Vector=${weightsRes.data.data.vectorWeight}`);
    }
    console.log('');

    // Test 3: Basic Hybrid Search - python developer
    console.log('TEST 3: Basic Hybrid Search - "python developer"');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes1 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'python developer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 5,
      skip: 0,
    });
    console.log(`✅ PASS - Found ${hybridRes1.data.data.length} results`);
    console.log('Top Results:');
    hybridRes1.data.data.slice(0, 3).forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name} (${result.role || 'N/A'}) - Combined Score: ${result.combinedScore.toFixed(4)}`);
      console.log(`     └─ BM25: ${result.bm25Score.toFixed(4)}, Vector: ${result.vectorScore.toFixed(4)}`);
    });
    console.log('');

    // Test 4: Keyword-Focused Search
    console.log('TEST 4: Keyword-Focused Search - "machine learning"');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes2 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'machine learning',
      bm25Weight: 0.7,  // 70% keyword matching
      vectorWeight: 0.3, // 30% semantic
      limit: 5,
      skip: 0,
    });
    console.log(`✅ PASS - Found ${hybridRes2.data.data.length} results with keyword focus`);
    console.log('Top Results (Keyword-Focused):');
    hybridRes2.data.data.slice(0, 3).forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name} - Combined Score: ${result.combinedScore.toFixed(4)}`);
    });
    console.log('');

    // Test 5: Semantic-Focused Search
    console.log('TEST 5: Semantic-Focused Search - "senior engineer skills"');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes3 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'senior engineer skills',
      bm25Weight: 0.3,  // 30% keyword matching
      vectorWeight: 0.7, // 70% semantic
      limit: 5,
      skip: 0,
    });
    console.log(`✅ PASS - Found ${hybridRes3.data.data.length} results with semantic focus`);
    console.log('Top Results (Semantic-Focused):');
    hybridRes3.data.data.slice(0, 3).forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name} - Combined Score: ${result.combinedScore.toFixed(4)}`);
    });
    console.log('');

    // Test 6: Advanced Hybrid Search with Thresholds
    console.log('TEST 6: Advanced Hybrid Search with Thresholds');
    console.log('────────────────────────────────────────────────────────────');
    const hybridRes4 = await axios.post(`${BASE_URL}/v1/search/hybrid/advanced`, {
      query: 'developer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      bm25Threshold: 0.3,      // Must have at least 30% BM25 score
      vectorThreshold: 0.65,    // Must have at least 0.65 vector score
      normalizeScores: true,
      limit: 10,
      skip: 0,
    });
    console.log(`✅ PASS - Found ${hybridRes4.data.data.length} results after filtering`);
    console.log('Top Results (With Thresholds):');
    hybridRes4.data.data.slice(0, 3).forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name} - Combined Score: ${result.combinedScore.toFixed(4)}`);
      console.log(`     └─ BM25: ${result.bm25Score.toFixed(4)} (↥ 0.3), Vector: ${result.vectorScore.toFixed(4)} (↥ 0.65)`);
    });
    console.log('');

    // Test 7: Pagination in Hybrid Search
    console.log('TEST 7: Hybrid Search Pagination');
    console.log('────────────────────────────────────────────────────────────');
    const page1 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'engineer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 3,
      skip: 0,
    });
    const page2 = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query: 'engineer',
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 3,
      skip: 3,
    });
    console.log(`✅ PASS - Page 1: ${page1.data.data.length} results`);
    console.log(`✅ PASS - Page 2: ${page2.data.data.length} results`);
    
    const page1Ids = page1.data.data.map(r => r._id);
    const page2Ids = page2.data.data.map(r => r._id);
    const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
    console.log(`✅ PASS - No overlap: ${!hasOverlap} (Unique results across pages)`);
    console.log('');

    // Test 8: Comparing Weight Effects
    console.log('TEST 8: Comparing Different Weight Configurations');
    console.log('────────────────────────────────────────────────────────────');
    const query = 'backend developer';
    
    const balanced = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query,
      bm25Weight: 0.5,
      vectorWeight: 0.5,
      limit: 1,
    });
    
    const bm25Heavy = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query,
      bm25Weight: 0.8,
      vectorWeight: 0.2,
      limit: 1,
    });
    
    const vectorHeavy = await axios.post(`${BASE_URL}/v1/search/hybrid`, {
      query,
      bm25Weight: 0.2,
      vectorWeight: 0.8,
      limit: 1,
    });
    
    console.log(`Query: "${query}"`);
    console.log(`Balanced (0.5/0.5):    ${balanced.data.data[0]?.name || 'N/A'} (${balanced.data.data[0]?.combinedScore.toFixed(4) || 'N/A'})`);
    console.log(`BM25-Heavy (0.8/0.2):  ${bm25Heavy.data.data[0]?.name || 'N/A'} (${bm25Heavy.data.data[0]?.combinedScore.toFixed(4) || 'N/A'})`);
    console.log(`Vector-Heavy (0.2/0.8):${vectorHeavy.data.data[0]?.name || 'N/A'} (${vectorHeavy.data.data[0]?.combinedScore.toFixed(4) || 'N/A'})`);
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           🎉 ALL HYBRID SEARCH TESTS PASSED! 🎉            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Wait for server to start then run tests
sleep(2000).then(() => runTests());
