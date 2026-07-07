import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/lead-pool/analytics - analytics for lead pools
export async function GET(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const period = searchParams.get('period') || '7days' // 7days, 30days, 90days

 // Calculate date range
 const now = new Date()
 const startDate = new Date()

 if (period === '7days') {
 startDate.setDate(now.getDate() - 7)
 } else if (period === '30days') {
 startDate.setDate(now.getDate() - 30)
 } else if (period === '90days') {
 startDate.setDate(now.getDate() - 90)
 }

 // 1. Upload analytics over time
 const { data: uploadAnalytics } = await supabase
 .from('lead_uploads')
 .select(`
 display_name,
 uploaded_at,
 lead_count,
 assigned_count
 `)
 .gte('uploaded_at', startDate.toISOString())

 const uploadsByDay = uploadAnalytics?.reduce((acc: any, upload: any) => {
 const date = new Date(upload.uploaded_at).toISOString().split('T')[0]
 if (!acc[date]) {
 acc[date] = {
 uploads: 0,
 total_leads: 0,
 assigned_leads: 0,
 }
 }
 acc[date].uploads += 1
 acc[date].total_leads += upload.lead_count
 acc[date].assigned_leads += upload.assigned_count
 return acc
 }, {}) || {}

 // 2. Total metrics
 const { count: totalUploads } = await supabase
 .from('lead_uploads')
 .select('*', { count: 'exact', head: true })
 .gte('uploaded_at', startDate.toISOString())

 const { count: totalLeads } = await supabase
 .from('leads')
 .select('*', { count: 'exact', head: true })
 .gte('created_at', startDate.toISOString())

 const { count: assignedLeads } = await supabase
 .from('leads')
 .select('*', { count: 'exact', head: true })
 .gte('created_at', startDate.toISOString())
 .neq('assigned_to', null)

 const { count: doneLeads } = await supabase
 .from('leads')
 .select('*', { count: 'exact', head: true })
 .gte('created_at', startDate.toISOString())
 .eq('status', 'done')

 // 3. Best performing uploads
 const { data: topUploads } = await supabase
 .from('lead_uploads')
 .select(`
 display_name,
 lead_count,
 assigned_count,
 done_count,
 rejected_count
 `)
 .gte('uploaded_at', startDate.toISOString())
 .order('done_count', { ascending: false })
 .limit(5)

 // 4. Monthly breakdown
 const monthlyData = await supabase.rpc('get_monthly_lead_stats', {
 month_from: startDate.toISOString().split('T')[0]
 })

 // 5. Active uploads counts
 const { data: activeUploads } = await supabase
 .from('lead_uploads')
 .select('lead_count, assigned_count')
 .eq('is_active', true)

 const activeStats = activeUploads?.reduce((acc, upload) => {
 acc.total_leads += upload.lead_count
 acc.assigned_leads += upload.assigned_count
 return acc
 }, { total_leads: 0, assigned_leads: 0 }) || { total_leads: 0, assigned_leads: 0 }

 return NextResponse.json({
 uploadsByDay,
 topUploads: topUploads || [],
 monthlyStats: monthlyData || [],
 totals: {
 uploads: totalUploads || 0,
 leads: totalLeads || 0,
 assigned: assignedLeads || 0,
 done: doneLeads || 0,
 },
 activeStats,
 period,
 })
}
