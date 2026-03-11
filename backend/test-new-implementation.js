const axios = require('axios');

async function testNewImplementation() {
  const testRecords = [
    {
      name: 'Jane Smith',
      email: 'jane@test.com',
      phone: '555-5678',
      location: 'San Francisco',
      company: 'AI Innovations',
      role: 'ML Engineer',
      education: 'MS Data Science',
      totalExperience: 6,
      relevantExperience: 4,
      skills: ['TensorFlow', 'PyTorch', 'AWS', 'Kubernetes'],
      text: 'Machine Learning Engineer with expertise in deep learning and production ML systems'
    }
  ];

  try {
    console.log('✓ Testing new dynamic embedding implementation...');
    console.log('Sending test data...\n');
    
    const response = await axios.post(
      'http://localhost:5000/api/store-embed/store-and-embed',
      { records: testRecords },
      { timeout: 30000 }
    );

    console.log('✓ Response received');
    console.log('Status Code:', response.status);
    console.log('Success count:', response.data.successCount);
    console.log('Failure count:', response.data.failureCount);
    
    if (response.data.results && response.data.results[0]) {
      const result = response.data.results[0];
      console.log('\nFirst result details:');
      console.log('  - Resume ID:', result.resumeId);
      console.log('  - Name:', result.name);
      console.log('  - Email:', result.email);
      console.log('  - Status:', result.status);
      console.log('  - Embedding Dimension:', result.embeddingDimension);
      console.log('  - Fields Embedded:', result.fieldsEmbedded?.join(', ') || 'N/A');
      
      if (result.status === 'completed' && result.embeddingDimension === 1024) {
        console.log('\n✓✓✓ SUCCESS: Dynamic vector index configuration working!');
        console.log('  - Embeddings generated from specified fields');
        console.log('  - 1024-dimensional vector created');
        console.log('  - Metadata captured in response');
      } else if (result.status === 'failed') {
        console.log('\n✗ ERROR: Embedding failed');
        console.log('  - Error:', result.error);
      }
    }
  } catch (error) {
    console.error('\n✗ Error:', error.response?.data?.message || error.message);
    console.error('Details:', error.response?.data);
  }
}

testNewImplementation();
