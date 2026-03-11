const mongoose = require('mongoose');

async function testSimpleVectorSearch() {
  try {
    const uri = 'mongodb+srv://nithiyamridini_db_user:LKNWXKKQVJaCjRlh@cluster0.bgrfj5n.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(uri, { dbName: 'db-testcases' });
    
    const db = mongoose.connection.db;
    const resumes = db.collection('resumes');
    
    console.log('\n========== TRYING DIFFERENT VECTOR SEARCH SYNTAXES ==========\n');
    
    // Get a test embedding
    const testDoc = await resumes.findOne({
      embedding: { $exists: true, $type: 'array', $ne: [] }
    });
    
    const testVector = testDoc.embedding;
    console.log('Test vector length:', testVector.length);
    console.log('Using embedding from:', testDoc.name);
    
    // Test with minimal parameters
    console.log('\n(1) Minimal query (only required params):');
    try {
      const results = await resumes.aggregate([
        {
          $search: {
            vectorSearch: {
              queryVector: testVector,
              path: 'embedding',
              limit: 10,
              numCandidates: 200,
            },
          },
        },
        { $limit: 5 },
      ]).toArray();
      console.log(`    ✅ Results found: ${results.length}`);
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }
    
    // Test checking if the vector field is being recognized
    console.log('\n(2) Checking vector field with $match:');
    try {
      const count = await resumes.countDocuments({
        embedding: { $type: 'array' }
      });
      console.log(`    ✅ Documents with array embedding field: ${count}`);
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }
    
    // Modified query to check index name
    console.log('\n(3) Trying different field format (nested embedding object):');
    try {
      // Check if embedding might be nested differently
      const sampleResult = await resumes.findOne({}, { projection: { embedding: 1 } });
      if (sampleResult && sampleResult.embedding) {
        console.log(`    Field type: ${typeof sampleResult.embedding}`);
        console.log(`    Is array: ${Array.isArray(sampleResult.embedding)}`);
        console.log(`    First element type: ${typeof sampleResult.embedding[0]}`);
      }
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }
    
    // Test with string query fallback
    console.log('\n(4) Testing with string query (fallback - using BM25):');
    try {
      const queryText = 'python engineer';
      const results = await resumes.aggregate([
        {
          $search: {
            text: {
              query: queryText,
              path: 'text',
            },
          },
        },
        { $limit: 3 },
        { $project: { name: 1, score: { $meta: 'searchScore' } } },
      ]).toArray();
      console.log(`    ✅ BM25 Results found: ${results.length}`);
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
    }
    
    await mongoose.disconnect();
    console.log('\n========== TEST COMPLETE ==========\n');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

testSimpleVectorSearch();
