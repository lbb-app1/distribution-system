import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Insert 1 point for being active (called every minute)
    const { error } = await supabase.from('activity_logs').insert({
        user_id: session.user.id,
        action_type: 'time_spent',
        points: 1,
        details: { unit: 'minute' }
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
