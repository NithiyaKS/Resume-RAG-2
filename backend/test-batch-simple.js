const axios = require('axios');

async function testWithFewerRecords() {
  try {
    // Generate 50 records instead for quicker testing
    const records = [];
    for (let i = 1; i <= 50; i++) {
      records.push({
        name: `Test ${i}`,
        email: `test${i}@example.com`,
        phone: `555-${i}`,
        location: 'Test City',
        company: 'Test Co',
        role: 'Engineer',
        education: 'BS',
        totalExperience: 5,
        relevantExperience: 3,
        skills: ['Python', 'TypeScript', 'AWS'],
        text: `Professional with 5 years experience in software development`,
      });
    }

    console.log('\n📤 Testing batch processing with 50 records...\n');

    const start = Date.now();
    const res = await axios.post(
      'http://localhost:5000/api/store-embed/store-and-embed',
      { records },
      { timeout: 120000 }
    );
    const time = Date.now() - start;

    console.log('✓ Response received!\n');
    console.log('Summary:', res.data.summary);
    console.log(`Time: ${time}ms\n`);

    if (res.data.summary.successful === 50) {
      console.log('✓✓✓ SUCCESS: Batch processing works!\n');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWithFewerRecords();
