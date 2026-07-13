import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PRESENT_THRESHOLD = 0.60

// Helper: compute is_present from task completion rate
async function computeAttendance(supabase: any, userId: string, date: string) {
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select('is_completed')
 .eq('user_id', userId)
 .eq('date', date)

 const totalTasks = tasks?.length || 0
 const completedTasks = tasks?.filter((t: any) => t.is_completed).length || 0
 const is_present = totalTasks > 0 ? (completedTasks / totalTasks) >= PRESENT_THRESHOLD : false

 return { totalTasks, completedTasks, is_present }
}

// POST /api/attendance/tasks - sync tasks from leads for a user on a date
// Also auto-marks attendance based on completion rate
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
 const tasksToUpsert = leads.map((lead: any) => ({
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

 // Always compute attendance stats
 const computed = await computeAttendance(supabase, session.user.id, targetDate)
 const { totalTasks, completedTasks, is_present: auto_present } = computed

 // Auto-mark attendance based on completion rate (>= 60% = present)
 // But only if no admin has manually overridden it
 const { data: existingRecord } = await supabase
 .from('daily_attendance')
 .select('marked_by')
 .eq('user_id', session.user.id)
 .eq('date', targetDate)
 .single()

 if (!existingRecord || !existingRecord.marked_by) {
 const { error: attError } = await supabase
 .from('daily_attendance')
 .upsert(
 {
 user_id: session.user.id,
 date: targetDate,
 total_tasks: totalTasks,
 completed_tasks: completedTasks,
 is_present: auto_present,
 marked_by: null,
 marked_at: new Date().toISOString(),
 },
 { onConflict: 'user_id,date' }
 )

 if (attError) {
 console.error('Auto-attendance error:', attError)
 }
 }

 // Return all tasks for this user/date
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select('*, lead:leads(lead_identifier, status, sub_status)')
 .eq('user_id', session.user.id)
 .eq('date', targetDate)
 .order('created_at', { ascending: true })

 return NextResponse.json({
 success: true,
 tasks_created: leads.length,
 tasks,
 attendance: { totalTasks, completedTasks, is_present: auto_present },
 })
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}