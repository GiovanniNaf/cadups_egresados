import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hionpdnlxmgsrqzbdfgz.supabase.co'; // Reemplaza con tu URL de Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpb25wZG5seG1nc3JxemJkZmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMDY4MzIsImV4cCI6MjA1MzU4MjgzMn0.LsBtXW5gDM49prTtaG8e1kJUaisPFqxhJg8uBApOSuM'; // Reemplaza con tu clave pública (anon key)

export const supabase = createClient(supabaseUrl, supabaseKey);
