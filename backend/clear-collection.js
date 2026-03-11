const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'db-testcases';

console.log('[INFO] Connecting to MongoDB...');
mongoose.connect(mongoUri, { dbName }).then(async () => {
  console.log('[INFO] Connected successfully');
  const db = mongoose.connection.db;
  
  try {
    const result = await db.collection('resumes').deleteMany({});
    console.log(`[INFO] Deleted ${result.deletedCount} documents from resumes collection`);
    
    const remaining = await db.collection('resumes').countDocuments();
    console.log(`[INFO] Remaining documents: ${remaining}`);
    
    if (remaining === 0) {
      console.log('[SUCCESS] ✓ Collection is now empty and ready for fresh ingestion');
    }
    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('[ERROR] Connection failed:', err.message);
  process.exit(1);
});
