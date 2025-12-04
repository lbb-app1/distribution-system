import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const all = searchParams.get('all')

    let query = supabase
        .from('leads')
        .select('*, assigned_to(username)')

    if (!all) {
        query = query.eq('assigned_date', date || new Date().toISOString().split('T')[0])
    }

    if (session.user.role !== 'admin') {
        query = query.eq('assigned_to', session.user.id)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
