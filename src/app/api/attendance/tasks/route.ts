import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/attendance/tasks - sync tasks from leads for a user on a date
export async function POST(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { date } = await request.json()
 const targetDate = date || new Date().toISOString().split('T')[0]

 // Get all leads assigned to this user for the target date
 const { data: leads, error: leadsError } = await supabase
 .from('leads')
 .select('id')
 .eq('assigned_to', session.user.id)
 .eq('assigned_date', targetDate)

 if (leadsError) {
 return NextResponse.json({ error: leadsError.message }, { status: 500 })
 }

 if (!leads || leads.length === 0) {
 return NextResponse.json({ success: true, tasks_created: 0 })
 }

 // Upsert tasks for each lead (in case they're already created)
 const tasksToUpsert = leads.map(lead => ({
 user_id: session.user.id,
 lead_id: lead.id,
 date: targetDate,
 is_completed: false,
 }))

 const { error: tasksError } = await supabase
 .from('daily_tasks')
 .upsert(tasksToUpsert, { onConflict: 'user_id,lead_id,date' })

 if (tasksError) {
 return NextResponse.json({ error: tasksError.message }, { status: 500 })
 }

 // Return all tasks for this user/date
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select('*, lead:leads(lead_identifier, status, sub_status)')
 .eq('user_id', session.user.id)
 .eq('date', targetDate)
 .order('created_at', { ascending: true })

 return NextResponse.json({ success: true, tasks_created: leads.length, tasks })
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
