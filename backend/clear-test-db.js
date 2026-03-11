const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const mongoUri = process.env.MONGODB_URI;

console.log('[INFO] Connecting to test database...');
mongoose.connect(mongoUri, { dbName: 'test' }).then(async () => {
  console.log('[INFO] Connected to test database');
  const db = mongoose.connection.db;
  
  try {
    const result = await db.collection('resumes').deleteMany({});
    console.log(`[INFO] Deleted ${result.deletedCount} documents from test.resumes`);
    
    const remaining = await db.collection('resumes').countDocuments();
    console.log(`[INFO] Remaining in test.resumes: ${remaining}`);
    console.log('[SUCCESS] ✓ Both databases cleared');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('[ERROR] Connection failed:', err.message);
  process.exit(1);
});
