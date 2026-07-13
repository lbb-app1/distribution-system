import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PRESENT_THRESHOLD = 0.60

// GET /api/attendance - get attendance for current user
// Always computes from current task state (never stale)
export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const date = searchParams.get('date')
 const userId = searchParams.get('user_id') || session.user.id
 const targetDate = date || new Date().toISOString().split('T')[0]

 // Non-admin can only view their own
 if (session.user.role !== 'admin' && userId !== session.user.id) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 // Fetch current tasks
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select('is_completed')
 .eq('user_id', userId)
 .eq('date', targetDate)

 const totalTasks = tasks?.length || 0
 const completedTasks = tasks?.filter((t: any) => t.is_completed).length || 0
 const is_present = totalTasks > 0 ? (completedTasks / totalTasks) >= PRESENT_THRESHOLD : false

 // Fetch stored attendance record (may have admin override)
 const { data: existingRecord } = await supabase
 .from('daily_attendance')
 .select('*')
 .eq('user_id', userId)
 .eq('date', targetDate)
 .single()

 // Use admin override if it exists, otherwise use computed value
 const finalPresent = existingRecord?.admin_override
 ? existingRecord.is_present
 : is_present

 const attendanceData = {
 id: existingRecord?.id,
 user_id: userId,
 date: targetDate,
 total_tasks: totalTasks,
 completed_tasks: completedTasks,
 is_present: finalPresent,
 marked_by: existingRecord?.marked_by || null,
 marked_at: existingRecord?.marked_at || new Date().toISOString(),
 admin_override: existingRecord?.admin_override || false,
 }

 // Upsert to keep cache fresh (won't override admin)
 if (!existingRecord?.admin_override) {
 await supabase
 .from('daily_attendance')
 .upsert({
 user_id: userId,
 date: targetDate,
 total_tasks: totalTasks,
 completed_tasks: completedTasks,
 is_present,
 marked_by: existingRecord?.marked_by || null,
 marked_at: existingRecord?.marked_at || new Date().toISOString(),
 admin_override: existingRecord?.admin_override || false,
 }, { onConflict: 'user_id,date' })
 }

 // Get task details for display
 const { data: taskDetails } = await supabase
 .from('daily_tasks')
 .select(`
 *,
 lead:leads!daily_tasks_lead_id_fkey(lead_identifier, status, sub_status)
 `)
 .eq('user_id', userId)
 .eq('date', targetDate)
 .order('created_at', { ascending: true })

 return NextResponse.json({
 ...attendanceData,
 tasks: taskDetails || [],
 })
}