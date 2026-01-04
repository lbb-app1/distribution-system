
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = 'https://pbychvfhxcdcjvxsvaig.supabase.co';
// Using the anon key found in your .env.local from previous context
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWNodmZoeGNkY2p2eHN2YWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDcxMDUsImV4cCI6MjA4MzA4MzEwNX0.7sMp3vKCic0SLkLkYJ7Vq925tsZAteinDho26ijRkUg';

const supabase = createClient(url, key);

async function createAdmin() {
    const username = 'yadish';
    const password = 'Yadish@123123';

    console.log(`Creating admin user: ${username}`);

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Upsert user (create if not exists, update if exists)
    const { data, error } = await supabase
        .from('users')
        .upsert({
            username,
            password_hash: hash,
            role: 'admin',
            is_active: true
        }, { onConflict: 'username' })
        .select();

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('Admin user created successfully.');
        console.log('Username:', username);
        console.log('Password:', password);
        console.log('Data:', data);
    }
}

createAdmin();
