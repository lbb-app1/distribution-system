import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*, assigned_to(username)')
            .not('sub_status', 'is', null)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(leads)
    } catch (error) {
        console.error('Admin Tracking API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
