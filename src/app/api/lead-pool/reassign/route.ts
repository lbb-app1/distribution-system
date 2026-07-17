import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

 const { data: targetUser } = await supabaseAdmin
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
 const { data: updated } = await supabaseAdmin
 .from('leads')
 .update({ assigned_to: user_id, assigned_date: new Date().toISOString().split('T')[0], status: 'pending' })
 .eq('upload_id', upload_id)
 .is('assigned_to', null)
 .select('id')

 targetLeadIds = (updated || []).map((l: any) => l.id)
 } else if (lead_ids) {
 targetLeadIds = lead_ids
 await supabaseAdmin
 .from('leads')
 .update({ assigned_to: user_id, assigned_date: new Date().toISOString().split('T')[0], status: 'pending' })
 .in('id', targetLeadIds)
 } else if (count) {
 const { data: updated } = await supabaseAdmin
 .from('leads')
 .update({ assigned_to: user_id, assigned_date: new Date().toISOString().split('T')[0], status: 'pending' })
 .eq('upload_id', upload_id)
 .is('assigned_to', null)
 .order('created_at')
 .limit(count)
 .select('id')

 targetLeadIds = (updated || []).map((l: any) => l.id)
 } else {
 return NextResponse.json({ error: 'lead_ids, reassign_all, or count is required' }, { status: 400 })
 }

 if (targetLeadIds.length === 0) {
 return NextResponse.json({ error: 'No available leads to reassign' }, { status: 400 })
 }

 const today = new Date().toISOString().split('T')[0]

 const attendancePayload = { user_id: targetUser.id, date: today, total_tasks: targetLeadIds.length, completed_tasks: 0 }
 await supabaseAdmin.from('daily_attendance').upsert(attendancePayload, { onConflict: 'user_id,date' })

 const taskRows = targetLeadIds.map(leadId => ({ user_id: targetUser.id, lead_id: leadId, date: today, is_completed: false }))
 await supabaseAdmin.from('daily_tasks').upsert(taskRows, { onConflict: 'user_id,lead_id,date' })

 await supabaseAdmin.from('bulk_operations').insert({
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
