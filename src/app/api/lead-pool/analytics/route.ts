import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/lead-pool/analytics - optimized single-query analytics
export async function GET(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const period = searchParams.get('period') || '30days'

 // Calculate date range
 const startDate = new Date()
 if (period === '7days') startDate.setDate(startDate.getDate() - 7)
 else if (period === '30days') startDate.setDate(startDate.getDate() - 30)
 else startDate.setDate(startDate.getDate() - 90)
 const startStr = startDate.toISOString().split('T')[0]

 // === SINGLE OPTIMIZED QUERY ===
 // Fetch all needed data in 3 parallel queries instead of 8

 // Query 1: Upload stats with leads aggregated (parallel)
 const [uploadsResult, leadsResult] = await Promise.all([
 // All uploads with counts from the lead_uploads table (already aggregated)
 supabase
 .from('lead_uploads')
 .select('id, display_name, file_name, uploaded_at, lead_count, assigned_count, done_count, rejected_count, pending_count, is_active')
 .gte('uploaded_at', startStr)
 .order('uploaded_at', { ascending: false }),

 // Single query: leads breakdown by status using RPC or aggregate
 supabase
 .from('leads')
 .select('status', { count: 'exact', head: true })
 .gte('created_at', startStr)
 ])

 const uploads = uploadsResult.data || []

 // === COMPUTE METRICS FROM DATA (no extra DB calls) ===
 const uploadsByDay: Record<string, { uploads: number; total_leads: number; assigned_leads: number }> = {}
 let totalLeadsFromUploads = 0
 let assignedFromUploads = 0
 let doneFromUploads = 0

 uploads.forEach((upload: any) => {
 const date = new Date(upload.uploaded_at).toISOString().split('T')[0]
 if (!uploadsByDay[date]) {
 uploadsByDay[date] = { uploads: 0, total_leads: 0, assigned_leads: 0 }
 }
 uploadsByDay[date].uploads++
 uploadsByDay[date].total_leads += upload.lead_count || 0
 uploadsByDay[date].assigned_leads += upload.assigned_count || 0
 totalLeadsFromUploads += upload.lead_count || 0
 assignedFromUploads += upload.assigned_count || 0
 doneFromUploads += upload.done_count || 0
 })

 // Top 5 performing uploads (computed, not extra query)
 const topUploads = [...uploads]
 .sort((a, b) => (b.done_count || 0) - (a.done_count || 0))
 .slice(0, 5)
 .map((u: any) => ({
 display_name: u.display_name,
 file_name: u.file_name,
 lead_count: u.lead_count,
 done_count: u.done_count,
 conversion_rate: u.lead_count > 0 ? Math.round((u.done_count / u.lead_count) * 100) : 0,
 }))

 // Active stats (from the same uploads query, no extra call)
 const activeUploads = uploads.filter((u: any) => u.is_active)
 const activeStats = activeUploads.reduce((acc: any, u: any) => {
 acc.total_leads += u.lead_count || 0
 acc.assigned_leads += u.assigned_count || 0
 return acc
 }, { total_leads: 0, assigned_leads: 0 })

 // Summary totals
 const totals = {
 uploads: uploads.length,
 leads: totalLeadsFromUploads,
 assigned: assignedFromUploads,
 done: doneFromUploads,
 conversion_rate: totalLeadsFromUploads > 0 ? Math.round((doneFromUploads / totalLeadsFromUploads) * 100) : 0,
 }

 return NextResponse.json({
 uploadsByDay,
 topUploads,
 activeStats,
 totals,
 period,
 })
}
