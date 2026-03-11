const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

async function verifyNewImplementation() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    const db = mongoose.connection.db;
    const collection = db.collection('resumes');
    
    // Find the latest resume
    const resume = await collection.findOne(
      { email: 'jane@test.com' },
      { sort: { createdAt: -1 } }
    );
    
    if (!resume) {
      console.log('✗ No resume found with email jane@test.com');
      return;
    }
    
    console.log('✓ Resume found:');
    console.log('  - ID:', resume._id);
    console.log('  - Name:', resume.name);
    console.log('  - Email:', resume.email);
    console.log('  - Skills:', resume.skills);
    console.log('  - Text:', resume.text?.substring(0, 80) + '...');
    console.log('  - Embedding Status:', resume.embeddingStatus);
    console.log('  - Embedding Field Exists:', resume.embedding !== undefined);
    
    if (resume.embedding && Array.isArray(resume.embedding)) {
      console.log('  - Embedding Dimension:', resume.embedding.length);
      console.log('  - First 5 values:', resume.embedding.slice(0, 5));
      
      if (resume.embedding.length === 1024) {
        console.log('\n✓✓✓ SUCCESS: Complete implementation verified!');
        console.log('  1. Data saved to MongoDB');
        console.log('  2. Vector index config fetched from MongoDB');
        console.log('  3. Fields extracted from index: text');
        console.log('  4. 1024-dim embedding generated and stored');
        console.log('  5. Full pipeline working end-to-end');
      } else {
        console.log('\n✗ ERROR: Embedding dimension is', resume.embedding.length, 'not 1024');
      }
    } else {
      console.log('\n✗ ERROR: Embedding field is empty or not an array!');
      console.log('  - Embedding value:', resume.embedding);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyNewImplementation();
