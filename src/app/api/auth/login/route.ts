import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single()

        if (error) {
            console.error('Info: Login Supabase Error:', error.message)
            // PGRST116 is the code for "JSON object requested, multiple (or no) rows returned" when using .single()
            // However, depending on the version/query, checking error.details or code is safer.
            // If it's a connection error, it won't be PGRST116.

            // If rows are 0 and .single() was used, it implies user not found.
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
            }

            return NextResponse.json({ error: 'Database Connection Error', details: error.message }, { status: 500 })
        }

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, user.password_hash)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        await createSession({ id: user.id, username: user.username, role: user.role })
        return NextResponse.json({ success: true, role: user.role })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
