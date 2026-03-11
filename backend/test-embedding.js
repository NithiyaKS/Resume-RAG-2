const axios = require('axios');
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });

console.log('Testing Mistral Embedding API...');
console.log('Mistral API Key:', process.env.MISTRAL_API_KEY ? '***SET***' : '***NOT SET***');
console.log('Mistral API URL:', process.env.MISTRAL_API_URL);

async function testEmbedding() {
  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/embeddings',
      {
        input: ['hello world', 'test embedding'],
        model: 'mistral-embed'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✓ Mistral API Response Received');
    console.log('Status:', response.status);
    console.log('Number of embeddings:', response.data.data.length);
    console.log('First embedding dimension:', response.data.data[0]?.embedding.length);
    console.log('First 5 values of first embedding:', response.data.data[0]?.embedding.slice(0, 5));
    
    if (response.data.data[0]?.embedding.length === 1024) {
      console.log('\n✓✓✓ CONFIRMED: Embeddings are 1024-dimensional as expected!');
    } else {
      console.log('\n✗ WARNING: Embedding dimension is', response.data.data[0]?.embedding.length, 'not 1024');
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testEmbedding();
