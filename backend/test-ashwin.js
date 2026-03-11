const http = require('http');

const data = JSON.stringify({
  query: "Senior Node.js backend engineer with MongoDB experience",
  candidate: {
    _id: "691db80aa895776f97b6eca6",
    name: "Ashwin P",
    snippet: "Built scalable Node.js REST APIs, optimized MongoDB queries, designed sharding and indexing strategies..."
  },
  style: "detailed",
  maxTokens: 150
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/v1/search/summarize',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('\nAPI Response:');
    console.log(JSON.stringify(JSON.parse(responseData), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
