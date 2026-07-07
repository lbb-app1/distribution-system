import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/attendance/admin - admin view of all attendance
// Query params: date (specific date), days (last N days, default 30)
export async function GET(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const date = searchParams.get('date')
 const days = parseInt(searchParams.get('days') || '30')

 // Fetch attendance records without embedding (avoid multi-FK ambiguity)
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

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 // Manually fetch user data to avoid FK ambiguity
 const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))]
 const markedByIds = [...new Set((data || []).map(r => r.marked_by).filter(Boolean))]
 const allUserIds = [...new Set([...userIds, ...markedByIds])]

 let userMap: Record<string, any> = {}
 if (allUserIds.length > 0) {
 const { data: users } = await supabase
 .from('users')
 .select('id, username, role')
 .in('id', allUserIds)

 if (users) {
 users.forEach(u => { userMap[u.id] = u })
 }
 }

 // Attach user data manually and group
 const raw = (data || []).map(record => ({
 ...record,
 user: userMap[record.user_id] || null,
 marked_by_user: record.marked_by ? userMap[record.marked_by] || null : null,
 }))

 const groupedByUser: Record<string, any> = {}
 raw.forEach(record => {
 const uid = record.user_id
 if (!uid) return
 if (!groupedByUser[uid]) {
 groupedByUser[uid] = {
 id: uid,
 ...(record.user || {}),
 records: [],
 total_present: 0,
 total_days: 0,
 }
 }
 groupedByUser[uid].records.push(record)
 groupedByUser[uid].total_days++
 if (record.is_present) groupedByUser[uid].total_present++
 })

 return NextResponse.json({
 raw,
 grouped: Object.values(groupedByUser),
 days,
 })
}
