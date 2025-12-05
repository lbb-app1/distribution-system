import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const { status, notes } = await request.json()
        const updates: any = {}

        if (status) {
            if (!['pending', 'done', 'rejected'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
            }
            updates.status = status
        }

        if (notes !== undefined) {
            updates.notes = notes
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
        }

        // If user, ensure they own the lead
        if (session.user.role !== 'admin') {
            const { data: lead } = await supabase
                .from('leads')
                .select('assigned_to')
                .eq('id', id)
                .single()

            if (!lead || lead.assigned_to !== session.user.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        const { data, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
