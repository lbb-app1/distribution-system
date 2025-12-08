import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 })
    }
    if (session.user.role !== 'admin') {
        return NextResponse.json({ error: `Unauthorized: Role is ${session.user.role}, expected admin` }, { status: 401 })
    }

    try {
        // Fetch all users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, is_active')
            .eq('role', 'user')

        if (usersError) throw usersError

        // Fetch settings
        const { data: settings, error: settingsError } = await supabase
            .from('auto_assign_settings')
            .select('*')

        if (settingsError) throw settingsError

        // Merge
        const result = users.map(user => {
            const setting = settings?.find(s => s.user_id === user.id)
            return {
                ...user,
                daily_limit: setting?.daily_limit || 0,
                is_enabled: setting?.is_enabled || false
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 })
    }
    if (session.user.role !== 'admin') {
        return NextResponse.json({ error: `Unauthorized: Role is ${session.user.role}, expected admin` }, { status: 401 })
    }

    try {
        const { settings } = await request.json() // { userId, daily_limit, is_enabled }[]

        const upsertData = settings.map((s: any) => ({
            user_id: s.userId,
            daily_limit: s.daily_limit,
            is_enabled: s.is_enabled,
            updated_at: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('auto_assign_settings')
            .upsert(upsertData)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
