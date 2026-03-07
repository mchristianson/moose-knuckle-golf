// Simple script to ping Supabase and keep the project active
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Make a simple REST API call to keep the project active
const url = new URL(`${supabaseUrl}/rest/v1/users?select=id&limit=1`);

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey,
    'Content-Type': 'application/json',
  },
};

https
  .request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✓ Supabase pinged successfully');
        process.exit(0);
      } else {
        console.error(`✗ Failed with status ${res.statusCode}: ${data}`);
        process.exit(1);
      }
    });
  })
  .on('error', (err) => {
    console.error('✗ Error pinging Supabase:', err.message);
    process.exit(1);
  })
  .end();
