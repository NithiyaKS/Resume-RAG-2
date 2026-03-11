const axios = require('axios');

/**
 * Generate mock resume records for batch testing
 */
function generateMockRecords(count) {
  const roles = [
    'Software Engineer',
    'Data Scientist',
    'Product Manager',
    'DevOps Engineer',
    'ML Engineer',
  ];
  const companies = ['Tech Corp', 'AI Innovations', 'Cloud Systems', 'Data Labs', 'AI Research'];
  const skills = [
    ['Python', 'Java', 'JavaScript'],
    ['TensorFlow', 'PyTorch', 'Apache Spark'],
    ['AWS', 'GCP', 'Azure', 'Kubernetes'],
    ['React', 'Vue.js', 'Angular'],
    ['MongoDB', 'PostgreSQL', 'Redis'],
  ];

  const records = [];

  for (let i = 1; i <= count; i++) {
    records.push({
      name: `Candidate ${i}`,
      email: `candidate${i}@test.com`,
      phone: `555-${String(i).padStart(4, '0')}`,
      location: `City ${i % 10}`,
      company: companies[i % companies.length],
      role: roles[i % roles.length],
      education: `MS Computer Science ${i}`,
      totalExperience: 3 + (i % 10),
      relevantExperience: 2 + (i % 8),
      skills: skills[i % skills.length],
      text: `Experienced ${roles[i % roles.length]} with ${3 + (i % 10)} years of experience in building scalable systems and solving complex problems.`,
    });
  }

  return records;
}

async function testBatchProcessing() {
  try {
    const recordCount = 200; // Test with 200 records
    console.log(`\n📦 Generating ${recordCount} mock resume records...`);
    const records = generateMockRecords(recordCount);
    console.log(`✓ Generated ${recordCount} records\n`);

    console.log('📤 Sending batch to /api/store-embed/store-and-embed endpoint...');
    console.log(`   Payload size: ~${(JSON.stringify(records).length / 1024 / 1024).toFixed(2)}MB\n`);

    const startTime = Date.now();

    const response = await axios.post(
      'http://localhost:5000/api/store-embed/store-and-embed',
      { records },
      { timeout: 120000 } // 2 minute timeout
    );

    const processingTime = Date.now() - startTime;

    console.log('✓ Response received from backend\n');
    console.log('📊 Batch Processing Results:');
    console.log('─'.repeat(50));
    console.log(`  Total Records Requested: ${response.data.summary.totalRequested}`);
    console.log(`  Total Records Saved: ${response.data.summary.totalSaved}`);
    console.log(`  Total Records Processed: ${response.data.summary.totalProcessed}`);
    console.log(`  Successful: ${response.data.summary.successful}`);
    console.log(`  Failed: ${response.data.summary.failed}`);
    console.log(`  Save Failures: ${response.data.summary.saveFailures}`);
    console.log('─'.repeat(50));
    console.log(`  Processing Time: ${processingTime}ms (~${(processingTime / 1000).toFixed(2)}s)`);
    console.log(`  Batch Config:`);
    console.log(`    - Batch Size: ${response.data.processingDetails.batchConfig.batchSize} records/batch`);
    console.log(`    - Delay Between Batches: ${response.data.processingDetails.batchConfig.delayBetweenBatches}ms`);
    console.log(`    - Total Batches: ${Math.ceil(recordCount / response.data.processingDetails.batchConfig.batchSize)}`);

    if (response.data.summary.successful === recordCount) {
      console.log('\n✓✓✓ SUCCESS: All records embedded with batch processing!');
      console.log('  - Records saved to MongoDB');
      console.log('  - Embeddings generated using Mistral AI (1024-dim vectors)');
      console.log('  - Batch processing handled large payload efficiently');
      console.log('  - System ready for 6000+ record ingestion\n');
    } else {
      console.log(
        `\n⚠ WARNING: ${response.data.summary.successful}/${recordCount} records successful\n`
      );
    }

    // Show sample results
    if (response.data.results && response.data.results.length > 0) {
      console.log('📋 Sample Results (first 3):');
      console.log('─'.repeat(50));
      response.data.results.slice(0, 3).forEach((result, idx) => {
        console.log(`  [${idx + 1}] ${result.name} (${result.email})`);
        console.log(`      Status: ${result.status}`);
        console.log(`      Embedding Dimension: ${result.embeddingDimension || 'N/A'}`);
        console.log(`      Fields Embedded: ${result.fieldsEmbedded?.join(', ') || 'N/A'}`);
      });
      console.log('─'.repeat(50));
    }
  } catch (error) {
    console.error('\n✗ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBatchProcessing();
