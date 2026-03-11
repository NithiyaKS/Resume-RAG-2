/**
 * Test BM25 Search Endpoints
 * Run with: node test-bm25-search.js
 */

const http = require('http');

// Test 1: Initialize search indexes
function initializeIndexes() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/v1/search/init',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✓ Initialize Indexes Response:', response.status);
          console.log('  - Total Documents:', response.data.totalDocuments);
          console.log('  - Text Index Exists:', response.data.textIndexExists);
          console.log('  - Indexed Fields:', response.data.indexedFields);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({}));
    req.end();
  });
}

// Test 2: Get search stats
function getSearchStats() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/v1/search/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✓ Search Stats Response:', response.status);
          console.log('  - Total Documents:', response.data.totalDocuments);
          console.log('  - Text Index Exists:', response.data.textIndexExists);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Test 3: Perform BM25 search
function performBM25Search(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/v1/search/bm25',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✓ BM25 Search Response for "${query}":`, response.status);
          console.log('  - Total Matches:', response.data.total);
          console.log('  - Returned:', response.data.returned);
          console.log('  - Results:', response.data.results.slice(0, 3).map((r) => ({
            name: r.name,
            role: r.role,
            score: r.score.toFixed(2),
          })));
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(
      JSON.stringify({
        query,
        limit: 5,
        skip: 0,
      })
    );
    req.end();
  });
}

// Test 4: Perform advanced BM25 search
function performAdvancedBM25Search(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/v1/search/bm25/advanced',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(
            `✓ Advanced BM25 Search Response for "${query}":`,
            response.status
          );
          console.log('  - Total Matches:', response.data.total);
          console.log('  - Returned:', response.data.returned);
          console.log('  - Field Weights:', response.data.fieldWeights);
          console.log('  - Results:', response.data.results.slice(0, 3).map((r) => ({
            name: r.name,
            role: r.role,
            score: r.score.toFixed(2),
          })));
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(
      JSON.stringify({
        query,
        fields: {
          role: 2,
          skills: 1.5,
          company: 1,
        },
        limit: 5,
        skip: 0,
      })
    );
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('\n🔍 Testing BM25 Search Endpoints\n');
  console.log('======================================\n');

  try {
    // Test 1: Initialize indexes
    console.log('Test 1: Initialize Search Indexes');
    console.log('--------------------------------');
    await initializeIndexes();

    console.log('\n');

    // Test 2: Get search stats
    console.log('Test 2: Get Search Statistics');
    console.log('----------------------------');
    await getSearchStats();

    console.log('\n');

    // Test 3: Simple BM25 search
    console.log('Test 3: BM25 Search for "python"');
    console.log('--------------------------------');
    await performBM25Search('python');

    console.log('\n');

    // Test 4: BM25 search for another query
    console.log('Test 4: BM25 Search for "developer"');
    console.log('----------------------------------');
    await performBM25Search('developer');

    console.log('\n');

    // Test 5: Advanced BM25 search
    console.log('Test 5: Advanced BM25 Search for "senior engineer"');
    console.log('-------------------------------------------------');
    await performAdvancedBM25Search('senior engineer');

    console.log('\n✅ All BM25 Search tests completed!\n');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

runTests();
