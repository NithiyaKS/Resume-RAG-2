const axios = require('axios');

const API_URL = 'http://localhost:5000/v1/search';

async function runTests() {
  console.log('🧪 LLM Re-Ranking Service Tests\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check re-ranking service status
    console.log('\n✨ TEST 1: Get LLM Re-Ranking Service Status');
    console.log('-'.repeat(60));
    try {
      const statusRes = await axios.get(`${API_URL}/rerank/status`);
      console.log('✅ PASS - Service Status Endpoint');
      console.log(`   Model: ${statusRes.data.data.model}`);
      console.log(`   Configured: ${statusRes.data.data.configured}`);
      console.log(`   Default TopK: ${statusRes.data.data.defaultTopK}`);
      console.log(`   Default MaxTokens: ${statusRes.data.data.defaultMaxTokens}`);
    } catch (error) {
      console.log('❌ FAIL - Status Check');
      console.log(`   Error: ${error.response?.status} ${error.message}`);
    }

    // Test 2: Test input validation - empty query
    console.log('\n✨ TEST 2: Validation - Empty Query');
    console.log('-'.repeat(60));
    try {
      await axios.post(`${API_URL}/rerank`, {
        query: '',
        candidates: [
          { _id: '1', name: 'John', role: 'Developer', company: 'TechCorp', skills: 'Python' },
        ],
      });
      console.log('❌ FAIL - Should reject empty query');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('empty')) {
        console.log('✅ PASS - Empty query correctly rejected');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log('❌ FAIL - Wrong error');
        console.log(`   Error: ${error.response?.data?.message}`);
      }
    }

    // Test 3: Validation - Empty candidates
    console.log('\n✨ TEST 3: Validation - Empty Candidates');
    console.log('-'.repeat(60));
    try {
      await axios.post(`${API_URL}/rerank`, {
        query: 'python developer',
        candidates: [],
      });
      console.log('❌ FAIL - Should reject empty candidates');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('non-empty')) {
        console.log('✅ PASS - Empty candidates array correctly rejected');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log('❌ FAIL - Wrong error');
        console.log(`   Error: ${error.response?.data?.message}`);
      }
    }

    // Test 4: Validation - Too many candidates
    console.log('\n✨ TEST 4: Validation - Too Many Candidates (>100)');
    console.log('-'.repeat(60));
    try {
      const largeCandidates = Array.from({ length: 101 }, (_, i) => ({
        _id: `${i}`,
        name: `Candidate ${i}`,
        role: 'Developer',
        company: 'TechCorp',
        skills: 'Python',
      }));
      await axios.post(`${API_URL}/rerank`, {
        query: 'python developer',
        candidates: largeCandidates,
      });
      console.log('❌ FAIL - Should reject >100 candidates');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Maximum')) {
        console.log('✅ PASS - Candidates limit correctly enforced');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log('❌ FAIL - Wrong error');
        console.log(`   Error: ${error.response?.data?.message}`);
      }
    }

    // Test 5: Validation - invalid temperature
    console.log('\n✨ TEST 5: Validation - Invalid Temperature');
    console.log('-'.repeat(60));
    try {
      await axios.post(`${API_URL}/rerank`, {
        query: 'python developer',
        candidates: [
          { _id: '1', name: 'John', role: 'Developer', company: 'TechCorp', skills: 'Python' },
        ],
        temperature: 5,
      });
      console.log('❌ FAIL - Should reject temperature > 2');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('temperature')) {
        console.log('✅ PASS - Invalid temperature correctly rejected');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log('❌ FAIL - Wrong error');
      }
    }

    // Test 6: Validation - invalid maxTokens
    console.log('\n✨ TEST 6: Validation - Invalid MaxTokens');
    console.log('-'.repeat(60));
    try {
      await axios.post(`${API_URL}/rerank`, {
        query: 'python developer',
        candidates: [
          { _id: '1', name: 'John', role: 'Developer', company: 'TechCorp', skills: 'Python' },
        ],
        maxTokens: 5000,
      });
      console.log('❌ FAIL - Should reject maxTokens > 4000');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('maxTokens')) {
        console.log('✅ PASS - Invalid maxTokens correctly rejected');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log('❌ FAIL - Wrong error');
      }
    }

    // Test 7: Valid rerank request (will use fallback due to invalid API key)
    console.log('\n✨ TEST 7: Rerank Request with Fallback Handling');
    console.log('-'.repeat(60));
    try {
      const rerankRes = await axios.post(`${API_URL}/rerank`, {
        query: 'senior python developer with microservices',
        candidates: [
          {
            _id: '1',
            name: 'John Doe',
            role: 'Senior Python Developer',
            company: 'TechCorp',
            skills: 'Python, Django, Microservices',
            email: 'john@test.com',
            score: 0.85,
          },
          {
            _id: '2',
            name: 'Jane Smith',
            role: 'Backend Engineer',
            company: 'StartUp Inc',
            skills: 'Python, FastAPI, AWS',
            email: 'jane@test.com',
            score: 0.78,
          },
          {
            _id: '3',
            name: 'Bob Johnson',
            role: 'DevOps Engineer',
            company: 'CloudCorp',
            skills: 'Kubernetes, Docker, Python',
            email: 'bob@test.com',
            score: 0.72,
          },
        ],
        topK: 3,
        maxTokens: 800,
        temperature: 0.5,
        detailed: true,
      });

      if (rerankRes.data.status === 'success') {
        console.log('✅ PASS - Rerank request successful');
        console.log(`   Message: ${rerankRes.data.message}`);
        console.log(`   Results returned: ${rerankRes.data.data.length}`);
        console.log(`   Duration: ${rerankRes.data.metadata.durationMs}ms`);
        console.log('\n   Ranked Results:');
        rerankRes.data.data.forEach((candidate, idx) => {
          const originalScore = candidate.originalScore ? ` (original: ${candidate.originalScore.toFixed(3)})` : '';
          console.log(
            `   ${idx + 1}. ${candidate.name} - ${candidate.role} @ ${candidate.company}`
          );
          console.log(`      Rerank Score: ${candidate.rerankScore.toFixed(3)}${originalScore}`);
        });
      } else {
        console.log('❌ FAIL - Unexpected response status');
      }
    } catch (error) {
      console.log('❌ FAIL - Rerank request error');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 8: Verify response structure
    console.log('\n✨ TEST 8: Response Structure Validation');
    console.log('-'.repeat(60));
    try {
      const rerankRes = await axios.post(`${API_URL}/rerank`, {
        query: 'test query',
        candidates: [
          { _id: '1', name: 'Test', role: 'Dev', company: 'Corp', skills: 'JS', score: 0.8 },
        ],
        topK: 1,
      });

      const hasRequiredFields = (obj, fields) => fields.every(f => f in obj);

      const resultHasFields = hasRequiredFields(rerankRes.data.data[0], [
        '_id',
        'name',
        'role',
        'company',
        'rerankScore',
      ]);
      const metadataHasFields = hasRequiredFields(rerankRes.data.metadata, [
        'query',
        'totalCandidates',
        'rerankResults',
        'config',
      ]);

      if (resultHasFields && metadataHasFields) {
        console.log('✅ PASS - Response structure valid');
        console.log('   ✓ Result object has all required fields');
        console.log('   ✓ Metadata object has all required fields');
      } else {
        console.log('❌ FAIL - Missing required fields in response');
      }
    } catch (error) {
      console.log('❌ FAIL - Structure validation error');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ LLM Re-Ranking Service Tests Complete\n');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run tests after a short delay to ensure server is ready
setTimeout(runTests, 2000);
