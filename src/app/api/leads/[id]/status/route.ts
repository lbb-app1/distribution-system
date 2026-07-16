import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { id } = await params
 const { status, notes, sub_status, is_completed } = await request.json()
 const updates: any = {}

 if (status) {
 if (!['pending', 'done', 'rejected'].includes(status)) {
 return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
 }
 updates.status = status
 if (status !== 'done') {
 updates.sub_status = null
 }
 }

 if (sub_status !== undefined) {
 if (sub_status !== null && !['Replied', 'Seen', 'Booked', 'Closed'].includes(sub_status)) {
 return NextResponse.json({ error: 'Invalid sub_status' }, { status: 400 })
 }
 updates.sub_status = sub_status
 }

 if (notes !== undefined) {
 updates.notes = notes
 }

 if (is_completed !== undefined) {
 // Update daily_task completion status
 const targetDate = new Date().toISOString().split('T')[0]
 const { data: existingTask } = await supabase
 .from('daily_tasks')
 .select('id, user_id, date')
 .eq('lead_id', id)
 .eq('user_id', session.user.id)
 .eq('date', targetDate)
 .single()

 if (existingTask) {
 await supabase
 .from('daily_tasks')
 .update({
  is_completed: is_completed,
 completed_at: is_completed ? new Date().toISOString() : null,
 })
 .eq('id', existingTask.id)

 // Check if all tasks are now completed
 const { data: allTasks } = await supabase
 .from('daily_tasks')
 .select('is_completed')
 .eq('user_id', session.user.id)
 .eq('date', existingTask.date)

 const completedCount = allTasks?.filter((t: any) => t.is_completed).length || 0
 const totalCount = allTasks?.length || 0

 // Upsert attendance record
 await supabase
 .from('daily_attendance')
 .upsert(
 {
 user_id: session.user.id,
 date: existingTask.date,
 total_tasks: totalCount,
 completed_tasks: completedCount,
 is_present: totalCount > 0 && completedCount === totalCount,
 marked_at: totalCount > 0 && completedCount === totalCount ? new Date().toISOString() : null,
 },
 { onConflict: 'user_id,date' }
 )
 }

 // Return early since this is just a task completion update
 return NextResponse.json({ success: true, is_completed })
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

 // Log Activity for Leaderboard
 let points = 0

 if (status === 'done') points += 5
 if (status === 'rejected') points += 1

 if (sub_status === 'Replied') points += 10
 if (sub_status === 'Booked') points += 50
 if (sub_status === 'Closed') points += 100

 if (notes) points += 2

 if (points > 0) {
 await supabase.from('activity_logs').insert({
 user_id: session.user.id,
 action_type: 'lead_update',
 points: points,
 details: { lead_id: id, updates: updates }
 })
 }

 return NextResponse.json(data)
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
