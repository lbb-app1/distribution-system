import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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
 const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))]
 let userMap: Record<string, any> = {}
 if (userIds.length > 0) {
 const { data: users } = await supabase
 .from('users')
 .select('id, username, role')
 .in('id', userIds)
 if (users) users.forEach(u => { userMap[u.id] = u })
 }

 // === PRE-GROUP ON SERVER (no client processing needed) ===
 const raw = (data || []).map(record => ({
 ...record,
 user: userMap[record.user_id] || null,
 }))

 const groupedByUser: Record<string, any> = {}
 raw.forEach(record => {
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

 // Pre-compute overall stats on server
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
