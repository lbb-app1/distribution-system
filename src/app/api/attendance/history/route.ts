import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PRESENT_THRESHOLD = 0.60

// GET /api/attendance/history - get user attendance history with date range
// Respects 60% threshold: if stored value differs, recalculate from tasks
export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const targetUserId = searchParams.get('user_id') || session.user.id
 const range = parseInt(searchParams.get('range') || '30')

 // Non-admin can only view their own
 if (session.user.role !== 'admin' && targetUserId !== session.user.id) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const cutoffDate = new Date()
 cutoffDate.setDate(cutoffDate.getDate() - range)

 const { data: records, error } = await supabase
 .from('daily_attendance')
 .select('*')
 .eq('user_id', targetUserId)
 .gte('date', cutoffDate.toISOString().split('T')[0])
 .order('date', { ascending: false })

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 // For non-admin-overridden records, recalculate to ensure 60% threshold accuracy
 const recalcDates = (records || [])
 .filter((r: any) => !r.admin_override)
 .map((r: any) => r.date)

 let correctedPresent: Record<string, boolean> = {}
 if (recalcDates.length > 0) {
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select('user_id, date, is_completed')
 .eq('user_id', targetUserId)
 .gte('date', cutoffDate.toISOString().split('T')[0])

 if (tasks) {
 const taskMap: Record<string, { total: number; completed: number }> = {}
 tasks.forEach((t: any) => {
 const key = t.date
 if (!taskMap[key]) taskMap[key] = { total: 0, completed: 0 }
 taskMap[key].total++
 if (t.is_completed) taskMap[key].completed++
 })
 Object.entries(taskMap).forEach(([date, totals]) => {
 if (totals.total > 0) {
 correctedPresent[date] = (totals.completed / totals.total) >= PRESENT_THRESHOLD
 }
 })
 }
 }

 const finalRecords = (records || []).map((r: any) => ({
 ...r,
 is_present: r.admin_override ? r.is_present : (correctedPresent[r.date] ?? r.is_present),
 }))

 const presentDays = finalRecords.filter((r: any) => r.is_present).length
 const totalDays = finalRecords.length

 // Generate calendar data for heatmap
 const today = new Date()
 const calendarMap: Record<string, 'present' | 'absent' | 'none'> = {}
 finalRecords.forEach((r: any) => {
 calendarMap[r.date] = r.is_present ? 'present' : 'absent'
 })

 const calendarDays = []
 for (let i = range - 1; i >= 0; i--) {
 const d = new Date()
 d.setDate(d.getDate() - i)
 const dateStr = d.toISOString().split('T')[0]
 calendarDays.push({
 date: dateStr,
 label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
 status: calendarMap[dateStr] || 'none',
 })
 }

 return NextResponse.json({
 records: finalRecords,
 summary: {
 totalDays,
 presentDays,
 absentDays: totalDays - presentDays,
 attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
 },
 calendarDays,
 range,
 })
}