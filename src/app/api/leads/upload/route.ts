import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { leads, userIds } = await request.json() // leads: string[], userIds: string[]

        if (!leads || leads.length === 0) {
            return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
        }

        const assignments = leads.map((lead: string) => ({
            lead_identifier: lead,
            assigned_to: null,
            status: 'pending',
            assigned_date: null // Not assigned yet
        }))

        const { error } = await supabase
            .from('leads')
            .insert(assignments)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: assignments.length })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
