
import { createClient } from '@supabase/supabase-js';

const url = 'https://pbychvfhxcdcjvxsvaig.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWNodmZoeGNkY2p2eHN2YWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDcxMDUsImV4cCI6MjA4MzA4MzEwNX0.7sMp3vKCic0SLkLkYJ7Vq925tsZAteinDho26ijRkUg';

const supabase = createClient(url, key);

async function check() {
    console.log('Checking connection to:', url);

    // 1. Check if we can reach the server
    try {
        const start = Date.now();
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        const time = Date.now() - start;

        if (error) {
            console.error('Error connecting/querying "users" table:');
            console.error(JSON.stringify(error, null, 2));
            if (error.code === '42P01') {
                console.log('--> DIAGNOSIS: The "users" table does not exist. You probably need to run the restore_schema.sql script.');
            }
        } else {
            console.log(`Success! Connected in ${time}ms.`);
            console.log(`"users" table exists.`);
        }

        // 2. Check for admin user
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('username, role')
            .eq('username', 'admin');

        if (users && users.length > 0) {
            console.log('Admin user found:', users[0]);
        } else {
            console.log('Admin user NOT found.');
            if (!error) console.log('--> DIAGNOSIS: User table is empty or admin is missing. Run the insert statement in restore_schema.sql.');
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

check();
