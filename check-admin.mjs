
import { createClient } from '@supabase/supabase-js';

const url = 'https://pbychvfhxcdcjvxsvaig.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWNodmZoeGNkY2p2eHN2YWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDcxMDUsImV4cCI6MjA4MzA4MzEwNX0.7sMp3vKCic0SLkLkYJ7Vq925tsZAteinDho26ijRkUg';

const supabase = createClient(url, key);

async function verify() {
    console.log('Verifying user "yadish" in the database...');

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'yadish')
        .single();

    if (error) {
        console.error('Error finding user:', error.message);
    } else if (user) {
        console.log('User FOUND in database:');
        console.log('ID:', user.id);
        console.log('Username:', user.username);
        console.log('Role:', user.role);
        console.log('Created At:', user.created_at);
    } else {
        console.log('User NOT found.');
    }
}

verify();
