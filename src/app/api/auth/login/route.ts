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

        if (error || !user) {
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
