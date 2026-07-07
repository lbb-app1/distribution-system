import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/attendance - get today's attendance for current user
export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const date = searchParams.get('date')
 const userId = searchParams.get('user_id')

 const targetUserId = userId || session.user.id
 const targetDate = date || new Date().toISOString().split('T')[0]

 // Non-admin can only view their own
 if (session.user.role !== 'admin' && targetUserId !== session.user.id) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 // Fetch attendance record without embedding
 const { data, error } = await supabase
 .from('daily_attendance')
 .select('*')
 .eq('user_id', targetUserId)
 .eq('date', targetDate)
 .single()

 if (error) {
 if (error.code === 'PGRST116') { // No rows found
 // Calculate from tasks
 const { count: total } = await supabase
 .from('daily_tasks')
 .select('*', { count: 'exact', head: true })
 .eq('user_id', targetUserId)
 .eq('date', targetDate)

 const { count: completed } = await supabase
 .from('daily_tasks')
 .select('*', { count: 'exact', head: true })
 .eq('user_id', targetUserId)
 .eq('date', targetDate)
 .eq('is_completed', true)

 return NextResponse.json({
 user_id: targetUserId,
 date: targetDate,
 total_tasks: total || 0,
 completed_tasks: completed || 0,
 is_present: false,
 tasks: [],
 })
 }
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 // Get individual tasks for this user/date
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select(`
 *,
 lead:leads!daily_tasks_lead_id_fkey(lead_identifier, status, sub_status)
 `)
 .eq('user_id', targetUserId)
 .eq('date', targetDate)
 .order('created_at', { ascending: true })

 return NextResponse.json({ ...data, tasks: tasks || [] })
}
