import { supabase } from './supabaseClient';

async function testSupabase() {
  try {
    const { data, error } = await supabase
      .from('your_table_name')  // Replace with a real table name from your Supabase project, e.g., 'users'
      .select('*')
      .limit(1);  // Limits to 1 row for a quick test

    if (error) {
      console.error('Error fetching data:', error.message);
    } else {
      console.log('Data fetched successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSupabase();
