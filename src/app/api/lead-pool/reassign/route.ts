import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/lead-pool/reassign - reassign leads from upload to specific users
// Body: { upload_id, user_id, lead_ids?, reassign_all?, count?, reason }
export async function POST(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { upload_id, user_id, lead_ids, reassign_all, count, reason } = await request.json()

 if (!upload_id || !user_id) {
 return NextResponse.json({ error: 'upload_id and user_id are required' }, { status: 400 })
 }

 // Verify the user exists and is not admin
 const { data: targetUser } = await supabase
 .from('users')
 .select('id, role')
 .eq('id', user_id)
 .eq('role', 'user')
 .single()

 if (!targetUser) {
 return NextResponse.json({ error: 'Target user not found or not a regular user' }, { status: 404 })
 }

 let targetLeadIds: string[] = []

 if (reassign_all) {
 // Get all unassigned leads from this upload
 const { data: allLeads } = await supabase
 .from('leads')
 .select('id')
 .eq('upload_id', upload_id)
 .eq('assigned_to', null)

 targetLeadIds = (allLeads || []).map((l: any) => l.id)
 } else if (lead_ids) {
 targetLeadIds = lead_ids
 } else if (count) {
 // Get specified count of unassigned leads
 const { data: allLeads } = await supabase
 .from('leads')
 .select('id')
 .eq('upload_id', upload_id)
 .eq('assigned_to', null)
 .order('created_at')
 .limit(count)

 targetLeadIds = (allLeads || []).map((l: any) => l.id)
 } else {
 return NextResponse.json({ error: 'lead_ids, reassign_all, or count is required' }, { status: 400 })
 }

 if (targetLeadIds.length === 0) {
 return NextResponse.json({ error: 'No available leads to reassign' }, { status: 400 })
 }

 // Reassign leads
 const today = new Date().toISOString().split('T')[0]
 const { error: updateError } = await supabase
 .from('leads')
 .update({
 assigned_to: user_id,
 assigned_date: today,
 status: 'pending',
 })
 .in('id', targetLeadIds)

 if (updateError) {
 return NextResponse.json({ error: updateError.message }, { status: 500 })
 }

 // Create/update attendance and tasks for today
 for (const leadId of targetLeadIds) {
 // Create attendance record for today
 await supabase
 .from('daily_attendance')
 .upsert(
 {
 user_id: targetUser.id,
 date: today,
 total_tasks: 0,
 completed_tasks: 0,
 },
 { onConflict: 'user_id,date' }
 )

 // Create task
 await supabase
 .from('daily_tasks')
 .upsert(
 {
 user_id: targetUser.id,
 lead_id: leadId,
 date: today,
 is_completed: false,
 },
 { onConflict: 'user_id,lead_id,date' }
 )
 }

 // Log the bulk operation
 await supabase.from('bulk_operations').insert({
 operation_type: 'reassign',
 upload_id,
 target_user_id: targetUser.id,
 lead_count: targetLeadIds.length,
 lead_ids: targetLeadIds,
 performed_by: session.user.id,
 notes: reason || `Reassigned ${targetLeadIds.length} leads from upload`,
 })

 return NextResponse.json({
 success: true,
 reassigned_count: targetLeadIds.length,
 reassigned_to: targetUser.id,
 })
 } catch (error) {
 console.error('Reassign error:', error)
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
