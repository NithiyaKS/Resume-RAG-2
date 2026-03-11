const mongoose = require('mongoose');

async function testVectorSearchConfigs() {
  try {
    const uri = 'mongodb+srv://nithiyamridini_db_user:LKNWXKKQVJaCjRlh@cluster0.bgrfj5n.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(uri, { dbName: 'db-testcases' });
    
    const db = mongoose.connection.db;
    const resumes = db.collection('resumes');
    
    console.log('\n========== VECTOR SEARCH CONFIGURATION DEBUG ==========\n');
    
    // Get vector index details
    console.log('Fetching vector search index configuration...\n');
    
    try {
      const indexes = await resumes.listSearchIndexes().toArray();
      const vectorIndex = indexes.find(idx => idx.name === 'resume_vector_index');
      
      if (vectorIndex) {
        console.log('Vector Index Details:');
        console.log(JSON.stringify(vectorIndex, null, 2));
      }
    } catch (err) {
      console.log('Could not get index details:', err.message);
    }
    
    // Test different query structures
    console.log('\n--- Testing Query Variations ---\n');
    
    const testEmbedding = new Array(1024).fill(0.1);
    
    // Test 1: With limit and numCandidates
    console.log('Test 1: With limit and numCandidates');
    try {
      const results1 = await resumes.aggregate([
        {
          $search: {
            vectorSearch: {
              queryVector: testEmbedding,
              path: 'embedding',
              limit: 5,
              numCandidates: 1000,
            },
          },
        },
        { $limit: 3 },
      ]).toArray();
      console.log(`  ✅ Result count: ${results1.length}\n`);
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
    
    // Test 2: Without limit
    console.log('Test 2: Without limit (only numCandidates and path)');
    try {
      const results2 = await resumes.aggregate([
        {
          $search: {
            vectorSearch: {
              queryVector: testEmbedding,
              path: 'embedding',
              numCandidates: 1000,
            },
          },
        },
        { $limit: 3 },
      ]).toArray();
      console.log(`  ✅ Result count: ${results2.length}\n`);
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
    
    // Test 3: Check if any documents actually match the vector query
    console.log('Test 3: Count all documents');
    const allDocs = await resumes.countDocuments();
    console.log(`  ✅ Total documents: ${allDocs}\n`);
    
    // Test 4: Try simple search to verify index works
    console.log('Test 4: Simple BM25 search (to verify $search works)');
    try {
      const bm25Results = await resumes.aggregate([
        {
          $search: {
            text: {
              query: 'python',
              path: 'skills',
            },
          },
        },
        { $limit: 3 },
      ]).toArray();
      console.log(`  ✅ BM25 search result count: ${bm25Results.length}\n`);
    } catch (err) {
      console.log(`  ❌ BM25 Error: ${err.message}\n`);
    }
    
    // Test 5: Check embedding distribution
    console.log('Test 5: Embedding Statistics');
    const stats = await resumes.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          withEmbedding: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ['$embedding', null] },
                  { $ne: ['$embedding', []] }
                ]},
                1,
                0
              ]
            }
          },
        }
      }
    ]).toArray();
    
    if (stats && stats.length > 0) {
      console.log(`  Total: ${stats[0].count}, With Embedding: ${stats[0].withEmbedding}`);
    }
    
    await mongoose.disconnect();
    console.log('\n========== DEBUG COMPLETE ==========\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVectorSearchConfigs();
