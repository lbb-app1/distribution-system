import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/attendance/admin - admin view of all attendance for a date
export async function GET(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
 const month = searchParams.get('month') // e.g. "2025-01"

 let query = supabase
 .from('daily_attendance')
 .select('*, user:users(id, username, role)')
 .order('date', { ascending: false })

 if (month) {
 query = query.like('date', `${month}%`)
 } else {
 query = query.eq('date', date)
 }

 const { data, error } = await query

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json(data || [])
}
