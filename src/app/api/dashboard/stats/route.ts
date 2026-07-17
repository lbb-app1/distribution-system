import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const [todayLeads, doneCount, pendingCount, usersResult] = await Promise.all([
 supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_date', new Date().toISOString().split('T')[0]),
 supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'done'),
 supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
 supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
 ])

 return NextResponse.json({
 totalLeadsToday: todayLeads.count || 0,
 completedTotal: doneCount.count || 0,
 pendingTotal: pendingCount.count || 0,
 totalUsers: usersResult.count || 0,
 })
}
