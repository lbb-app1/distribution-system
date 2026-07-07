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

 let query = supabase
 .from('daily_attendance')
 .select('*, user:users(id, username, role)')
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

 // Group by user
 const groupedByUser: Record<string, any> = {}
 ;(data || []).forEach((record: any) => {
 const uid = record.user?.id
 if (!uid) return
 if (!groupedByUser[uid]) {
 groupedByUser[uid] = {
 ...record.user,
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
 raw: data || [],
 grouped: Object.values(groupedByUser),
 days,
 })
}
