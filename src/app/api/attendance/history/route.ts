import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/attendance/history - get user attendance history with date range
export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const targetUserId = searchParams.get('user_id') || session.user.id
 const range = parseInt(searchParams.get('range') || '30') // 30, 60, 90

 // Non-admin can only view their own
 if (session.user.role !== 'admin' && targetUserId !== session.user.id) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const cutoffDate = new Date()
 cutoffDate.setDate(cutoffDate.getDate() - range)

 const { data, error } = await supabase
 .from('daily_attendance')
 .select('*')
 .eq('user_id', targetUserId)
 .gte('date', cutoffDate.toISOString().split('T')[0])
 .order('date', { ascending: false })

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 const records = data || []
 const totalDays = records.length
 const presentDays = records.filter(r => r.is_present).length
 const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

 // Generate calendar data for heatmap
 const today = new Date()
 const calendarMap: Record<string, 'present' | 'absent' | 'none'> = {}
 records.forEach(r => {
 calendarMap[r.date] = r.is_present ? 'present' : 'absent'
 })

 const calendarDays = []
 for (let i = range - 1; i >= 0; i--) {
 const d = new Date(today)
 d.setDate(d.getDate() - i)
 const dateStr = d.toISOString().split('T')[0]
 calendarDays.push({
 date: dateStr,
 label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
 status: calendarMap[dateStr] || 'none',
 })
 }

 return NextResponse.json({
 records,
 summary: {
 totalDays,
 presentDays,
 absentDays: totalDays - presentDays,
 attendanceRate,
 },
 calendarDays,
 range,
 })
}
