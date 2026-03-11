const mongoose = require('mongoose');

async function testVectorSearchWithRealEmbedding() {
  try {
    const uri = 'mongodb+srv://nithiyamridini_db_user:LKNWXKKQVJaCjRlh@cluster0.bgrfj5n.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(uri, { dbName: 'db-testcases' });
    
    const db = mongoose.connection.db;
    const resumes = db.collection('resumes');
    
    console.log('\n========== TESTING WITH REAL EMBEDDINGS ==========\n');
    
    // Get first document with embedding
    const doc1 = await resumes.findOne({
      embedding: { $exists: true, $type: 'array', $ne: [] }
    });
    
    if (!doc1) {
      console.log('❌ No documents with embeddings found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('Using embedding from:', doc1.name);
    console.log('Embedding length:', doc1.embedding.length);
    
    // Test 1: Query using the embedding from doc1
    console.log('\n--- Test 1: Query with doc1\'s embedding ---');
    try {
      const results1 = await resumes.aggregate([
        {
          $search: {
            vectorSearch: {
              queryVector: doc1.embedding,
              path: 'embedding',
              limit: 10,
              numCandidates: 1000,
            },
          },
        },
        {
          $addFields: {
            score: { $meta: 'searchScore' },
          },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            name: 1,
            role: 1,
            score: 1,
          },
        },
      ]).toArray();
      
      console.log(`✅ Found ${results1.length} results`);
      results1.forEach((r, i) => {
        console.log(`  ${i+1}. ${r.name} - Score: ${r.score?.toFixed(6) || 'N/A'}`);
      });
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
    
    // Test 2: Try $knn aggregation stage if it exists
    console.log('\n--- Test 2: Try $knn stage ---');
    try {
      const results2 = await resumes.aggregate([
        {
          $knn: {
            vector: doc1.embedding,
            path: 'embedding',
            k: 5,
          },
        },
        {
          $project: {
            name: 1,
            role: 1,
          },
        },
      ]).toArray();
      
      console.log(`✅ Found ${results2.length} results with $knn`);
      results2.forEach((r, i) => {
        console.log(`  ${i+1}. ${r.name}`);
      });
    } catch (err) {
      console.log(`⚠️ $knn not available: ${err.message}`);
    }
    
    // Test 3: Direct scoring test - compute similarity manually
    console.log('\n--- Test 3: Checking document structure ---');
    const sampleDocs = await resumes.find({
      embedding: { $exists: true, $type: 'array', $ne: [] }
    }).limit(3).toArray();
    
    sampleDocs.forEach((doc, i) => {
      if (doc.embedding && Array.isArray(doc.embedding)) {
        const similarity = computeCosineSimilarity(doc1.embedding, doc.embedding);
        console.log(`  ${i+1}. ${doc.name}: similarity = ${similarity.toFixed(6)}`);
      }
    });
    
    await mongoose.disconnect();
    console.log('\n========== TEST COMPLETE ==========\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function computeCosineSimilarity(vec1, vec2) {
  if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length !== vec2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

testVectorSearchWithRealEmbedding();
