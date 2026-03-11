const axios = require('axios');

async function testEmbeddingEndpoint() {
  const testRecords = [
    {
      name: 'John Doe',
      email: 'john@test.com',
      phone: '555-1234',
      location: 'New York',
      company: 'Tech Corp',
      role: 'Senior Developer',
      education: 'BS Computer Science',
      totalExperience: 8,
      relevantExperience: 6,
      skills: ['Python', 'JavaScript', 'MongoDB', 'REST APIs'],
      text: 'Senior Full Stack Developer with 8 years experience'
    }
  ];

  try {
    console.log('Sending embedding request to backend...');
    console.log('Test data:', JSON.stringify(testRecords[0], null, 2));
    
    const response = await axios.post(
      'http://localhost:5000/api/store-embed/store-and-embed',
      { records: testRecords }
    );

    console.log('\n✓ Backend Response Received');
    console.log('Status:', response.status);
    console.log('Success count:', response.data.successCount);
    console.log('Failure count:', response.data.failureCount);
    
    if (response.data.results && response.data.results[0]) {
      const result = response.data.results[0];
      console.log('\nFirst result:');
      console.log(JSON.stringify(result, null, 2));
      console.log('  - Resume ID:', result.resumeId);
      console.log('  - Name:', result.name);
      console.log('  - Email:', result.email);
      console.log('  - Status:', result.status);
      console.log('  - Embedding Dimension:', result.embeddingDimension);
      console.log('  - Error:', result.error);
      
      if (result.embeddingDimension === 1024) {
        console.log('\n✓✓✓ SUCCESS: Embedding saved with 1024 dimensions!');
      } else if (result.embeddingDimension === 0) {
        console.log('\n✗ ERROR: Embedding dimension is 0 - embeddings not being saved!');
      } else {
        console.log('\n✗ WARNING: Embedding dimension is', result.embeddingDimension);
      }
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testEmbeddingEndpoint();
