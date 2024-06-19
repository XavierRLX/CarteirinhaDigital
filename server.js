const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

const supabaseUrl = 'postgres://postgres.mjjumtkxcqbdbynzmqqh@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qanVtdGt4Y3FiZGJ5bnptcXFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODcxMDc1MiwiZXhwIjoyMDM0Mjg2NzUyfQ.MT0uF9QeZwDZC3Yqi9W60c9g294UD8vLs6z1GHM38m0';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static('public'));
app.use(express.json());

app.listen(port, () => {
console.log(`Server is running on http://localhost:${port}`);
});