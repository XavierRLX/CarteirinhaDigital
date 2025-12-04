// public/javaScript/supabaseClient.js
const SUPABASE_URL = 'https://sltwilhjbnorzicakhyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdHdpbGhqYm5vcnppY2FraHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTA1MDYsImV4cCI6MjA4MDM4NjUwNn0.zORXTa8ksNlm2_S2BRQSN_ESEehT31MFPVo539bVYRQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;
