import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/attendance/mark - create attendance record for a user on a date
export async function POST(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { user_id, date, total_tasks, completed_tasks, is_present, notes } = await request.json()

 // Non-admin can only mark their own attendance
 if (session.user.role !== 'admin' && user_id !== session.user.id) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const targetDate = date || new Date().toISOString().split('T')[0]
 const markedBy = session.user.role === 'admin' ? session.user.id : null

 const { data, error } = await supabase
 .from('daily_attendance')
 .upsert(
 {
 user_id,
 date: targetDate,
 total_tasks: total_tasks || 0,
 completed_tasks: completed_tasks || 0,
 is_present: is_present || false,
 marked_by: markedBy,
 marked_at: new Date().toISOString(),
 notes: notes || null,
 admin_override: markedBy ? true : false,
 },
 {
 onConflict: 'user_id,date',
 }
 )
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
