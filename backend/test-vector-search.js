const http = require('http');

// Helper function to make HTTP requests
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
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

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('\n========== VECTOR SEARCH TEST SUITE ==========\n');

  try {
    // Test 1: Get Vector Search Stats
    console.log('Test 1: Get Vector Search Statistics');
    console.log('Endpoint: GET /v1/search/vector/stats');
    const statsRes = await makeRequest('/v1/search/vector/stats', 'GET');
    console.log('Response:', JSON.stringify(statsRes.body, null, 2));

    if (statsRes.body.data) {
      console.log('✅ Total Documents:', statsRes.body.data.totalDocuments);
      console.log('✅ Documents with Embeddings:', statsRes.body.data.documentsWithEmbeddings);
      console.log('✅ Embedding Dimension:', statsRes.body.data.embeddingDimension);
      console.log('✅ Similarity Metric:', statsRes.body.data.similarityMetric);
    }

    console.log('\n---\n');

    // Test 2: Basic Vector Search - Query 1
    console.log('Test 2: Vector Search - "python developer"');
    console.log('Endpoint: POST /v1/search/vector');
    const searchRes1 = await makeRequest('/v1/search/vector', 'POST', {
      query: 'python developer',
      limit: 5,
      skip: 0,
    });
    console.log('Response Status:', searchRes1.status);
    if (searchRes1.body.data && searchRes1.body.data.length > 0) {
      console.log(`✅ Found ${searchRes1.body.data.length} similar results`);
      console.log('Top Results:');
      searchRes1.body.data.slice(0, 3).forEach((res, idx) => {
        console.log(`  ${idx + 1}. ${res.name} (${res.role}) - Score: ${res.score.toFixed(4)}`);
      });
    } else {
      console.log('Response:', JSON.stringify(searchRes1.body, null, 2));
    }

    console.log('\n---\n');

    // Test 3: Basic Vector Search - Query 2
    console.log('Test 3: Vector Search - "machine learning engineer"');
    const searchRes2 = await makeRequest('/v1/search/vector', 'POST', {
      query: 'machine learning engineer',
      limit: 5,
      skip: 0,
    });
    console.log('Response Status:', searchRes2.status);
    if (searchRes2.body.data && searchRes2.body.data.length > 0) {
      console.log(`✅ Found ${searchRes2.body.data.length} similar results`);
      console.log('Top Results:');
      searchRes2.body.data.slice(0, 3).forEach((res, idx) => {
        console.log(`  ${idx + 1}. ${res.name} (${res.role}) - Score: ${res.score.toFixed(4)}`);
      });
    } else {
      console.log('Response:', JSON.stringify(searchRes2.body, null, 2));
    }

    console.log('\n---\n');

    // Test 4: Advanced Vector Search with Threshold
    console.log('Test 4: Advanced Vector Search - "senior engineer" with scoreThreshold=0.7');
    console.log('Endpoint: POST /v1/search/vector/advanced');
    const advSearchRes = await makeRequest('/v1/search/vector/advanced', 'POST', {
      query: 'senior engineer',
      scoreThreshold: 0.7,
      limit: 5,
      skip: 0,
    });
    console.log('Response Status:', advSearchRes.status);
    if (advSearchRes.body.data && advSearchRes.body.data.length > 0) {
      console.log(`✅ Found ${advSearchRes.body.data.length} results above threshold`);
      console.log('Results:');
      advSearchRes.body.data.slice(0, 3).forEach((res, idx) => {
        console.log(`  ${idx + 1}. ${res.name} (${res.role}) - Score: ${res.score.toFixed(4)}`);
      });
    } else {
      console.log('Response:', JSON.stringify(advSearchRes.body, null, 2));
    }

    console.log('\n---\n');

    // Test 5: Pagination test
    console.log('Test 5: Vector Search with Pagination - "developer" (skip=0, limit=3)');
    const paginationRes1 = await makeRequest('/v1/search/vector', 'POST', {
      query: 'developer',
      limit: 3,
      skip: 0,
    });
    console.log('Page 1 (skip=0, limit=3):');
    if (paginationRes1.body.data && paginationRes1.body.data.length > 0) {
      console.log(`✅ Got ${paginationRes1.body.data.length} results`);
      paginationRes1.body.data.forEach((res, idx) => {
        console.log(`  ${idx + 1}. ${res.name}`);
      });
    }

    console.log('\n========== ALL TESTS COMPLETED ==========\n');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();
