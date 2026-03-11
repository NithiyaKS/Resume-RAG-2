const http = require('http');
const mongoose = require('mongoose');

// Test MongoDB direct vector search
async function testDirectVectorSearch() {
  try {
    const uri = 'mongodb+srv://nithiyamridini_db_user:LKNWXKKQVJaCjRlh@cluster0.bgrfj5n.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(uri, { dbName: 'db-testcases' });
    
    const db = mongoose.connection.db;
    const resumes = db.collection('resumes');
    
    // Check how many documents have embeddings
    console.log('\n--- Checking Embeddings in Database ---\n');
    
    const withEmbeddings = await resumes.countDocuments({
      embedding: { $exists: true, $type: 'array', $not: { $size: 0 } }
    });
    
    console.log('✅ Documents with embeddings:', withEmbeddings);
    
    // Get one document to inspect the embedding
    const sample = await resumes.findOne({
      embedding: { $exists: true, $type: 'array', $ne: [] }
    });
    
    if (sample) {
      console.log('\n✅ Sample document found:');
      console.log('  Name:', sample.name);
      console.log('  Email:', sample.email);
      console.log('  Role:', sample.role);
      if (sample.embedding) {
        console.log('  Embedding length:', sample.embedding.length);
        console.log('  First 5 values:', sample.embedding.slice(0, 5));
      }
    }
    
    // Check if vector search index exists
    console.log('\n--- Checking Vector Search Indexes ---\n');
    
    try {
      const indexes = await resumes.listSearchIndexes().toArray();
      console.log('✅ Found', indexes.length, 'search indexes:');
      indexes.forEach((idx, i) => {
        console.log(`  ${i+1}. ${idx.name} (${idx.status})`);
      });
    } catch (err) {
      console.log('⚠️ Could not list search indexes:', err.message);
    }
    
    // Try a direct aggregation query
    console.log('\n--- Testing Direct Vector Search Query ---\n');
    
    // Generate a simple test embedding (1024 zeros)
    const testEmbedding = new Array(1024).fill(0.1);
    
    try {
      const results = await resumes.aggregate([
        {
          $search: {
            vectorSearch: {
              queryVector: testEmbedding,
              path: 'embedding',
              limit: 5,
              numCandidates: 100,
            },
          },
        },
        {
          $addFields: {
            score: { $meta: 'searchScore' },
          },
        },
        {
          $limit: 3,
        },
        {
          $project: {
            name: 1,
            role: 1,
            score: 1,
          },
        },
      ]).toArray();
      
      console.log('✅ Direct query returned', results.length, 'results');
      if (results.length > 0) {
        results.forEach((res, i) => {
          console.log(`  ${i+1}. ${res.name} (${res.role}) - Score: ${res.score}`);
        });
      }
    } catch (err) {
      console.log('❌ Direct query failed:', err.message);
    }
    
    await mongoose.disconnect();
    console.log('\n--- Test Complete ---\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirectVectorSearch();
