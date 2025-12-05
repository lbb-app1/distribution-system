import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { assignments } = await request.json() // { userId: string, count: number }[]

        if (!assignments || !Array.isArray(assignments)) {
            return NextResponse.json({ error: 'Invalid assignments format' }, { status: 400 })
        }

        let totalAssigned = 0
        const errors = []

        for (const assignment of assignments) {
            const { userId, count } = assignment
            if (count <= 0) continue

            // Fetch 'count' unassigned leads
            const { data: leadsToAssign, error: fetchError } = await supabase
                .from('leads')
                .select('id')
                .is('assigned_to', null)
                .limit(count)

            if (fetchError) {
                errors.push(`Failed to fetch leads for user ${userId}`)
                continue
            }

            if (!leadsToAssign || leadsToAssign.length === 0) {
                // No more leads to assign
                break
            }

            const leadIds = leadsToAssign.map(l => l.id)

            // Update these leads
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    assigned_to: userId,
                    assigned_date: new Date().toISOString().split('T')[0]
                })
                .in('id', leadIds)

            if (updateError) {
                errors.push(`Failed to assign leads to user ${userId}`)
            } else {
                totalAssigned += leadIds.length
            }
        }

        return NextResponse.json({ success: true, count: totalAssigned, errors })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
