import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ results: [] })
    }

    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select(`
                *,
                assigned_to (username)
            `)
            .ilike('lead_identifier', `%${query}%`)
            .limit(20)

        if (error) throw error

        return NextResponse.json({ results: leads })
    } catch (error) {
        console.error('Admin Search API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
