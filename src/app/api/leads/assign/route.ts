import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { assignments } = await request.json()

 if (!assignments || !Array.isArray(assignments)) {
 return NextResponse.json({ error: 'Invalid assignments format' }, { status: 400 })
 }

 const results = []

 for (const assignment of assignments) {
 const { userId, count } = assignment
 if (count <= 0) continue

 // Atomic update: assign N unassigned leads in a single query
 const { data: updated, error: updateError } = await supabaseAdmin
 .from('leads')
 .update({
 assigned_to: userId,
 assigned_date: new Date().toISOString().split('T')[0]
 })
 .is('assigned_to', null)
 .limit(count)
 .select('id')

 if (updateError) {
 results.push({ userId, assigned: 0, error: updateError.message })
 } else {
 results.push({ userId, assigned: updated?.length || 0 })
 }
 }

 const totalAssigned = results.reduce((sum, r) => sum + r.assigned, 0)

 return NextResponse.json({ success: true, count: totalAssigned, results })
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
