import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PRESENT_THRESHOLD = 0.60

// GET /api/attendance/admin - optimized with server-side grouping
// Query params: date (specific date), days (last N days, default 30)
export async function GET(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const date = searchParams.get('date')
 const days = parseInt(searchParams.get('days') || '30')

 // === SINGLE QUERY: fetch attendance records ===
 let query = supabase
 .from('daily_attendance')
 .select('*')
 .order('date', { ascending: false })

 if (date) {
 query = query.eq('date', date)
 } else {
 const cutoffDate = new Date()
 cutoffDate.setDate(cutoffDate.getDate() - days)
 query = query.gte('date', cutoffDate.toISOString().split('T')[0])
 }

 const { data, error } = await query
 if (error) return NextResponse.json({ error: error.message }, { status: 500 })

 // === SECONDARY QUERY: fetch all users in ONE call ===
 const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))]
 let userMap: Record<string, any> = {}
 if (userIds.length > 0) {
 const { data: users } = await supabase
 .from('users')
 .select('id, username, role')
 .in('id', userIds)
 if (users) users.forEach((u: any) => { userMap[u.id] = u })
 }

 // === AUTO-RECALCULATE: use 60% threshold for non-admin-overridden records ===
 // Batch fetch tasks for all records that aren't admin-overridden
 const recordsToRecalc = (data || []).filter((r: any) => !r.admin_override && !r.marked_by)
 let taskTotals: Record<string, { total: number; completed: number }> = {}

 if (recordsToRecalc.length > 0) {
 // Get unique user_id+date pairs
 const pairs = recordsToRecalc.map((r: any) => ({ user_id: r.user_id, date: r.date }))
 const { data: tasks } = await supabase
 .from('daily_tasks')
 .select('user_id, date, is_completed')
 .or(pairs.map((p: any) => `and(user_id.eq.${p.user_id},date.eq.${p.date})`).join(','))

 if (tasks) {
 tasks.forEach((t: any) => {
 const key = `${t.user_id}-${t.date}`
 if (!taskTotals[key]) taskTotals[key] = { total: 0, completed: 0 }
 taskTotals[key].total++
 if (t.is_completed) taskTotals[key].completed++
 })
 }
 }

 // Apply recalculated values
 const raw = (data || []).map((record: any) => {
 if (!record.admin_override && !record.marked_by) {
 const key = `${record.user_id}-${record.date}`
 const totals = taskTotals[key]
 if (totals && totals.total > 0) {
 return {
 ...record,
 total_tasks: totals.total,
 completed_tasks: totals.completed,
 is_present: (totals.completed / totals.total) >= PRESENT_THRESHOLD,
 }
 }
 }
 return record
 }).map((record: any) => ({
 ...record,
 user: userMap[record.user_id] || null,
 }))

 // === PRE-GROUP ON SERVER ===
 const groupedByUser: Record<string, any> = {}
 raw.forEach((record: any) => {
 const uid = record.user_id
 if (!uid) return
 if (!groupedByUser[uid]) {
 groupedByUser[uid] = {
 id: uid,
 username: record.user?.username || 'Unknown',
 role: record.user?.role || 'user',
 records: [],
 total_present: 0,
 total_days: 0,
 }
 }
 groupedByUser[uid].records.push(record)
 groupedByUser[uid].total_days++
 if (record.is_present) groupedByUser[uid].total_present++
 })

 const grouped = Object.values(groupedByUser)

 const overallPresent = grouped.reduce((sum, g) => sum + g.total_present, 0)
 const overallTotal = grouped.reduce((sum, g) => sum + g.total_days, 0)

 return NextResponse.json({
 raw,
 grouped,
 days,
 stats: {
 totalUsers: grouped.length,
 overallPresent,
 overallTotal,
 attendanceRate: overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0,
 },
 })
}