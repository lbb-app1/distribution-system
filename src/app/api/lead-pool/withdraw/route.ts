import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/lead-pool/withdraw - withdraw leads from an upload
// Body: { upload_id, lead_ids?, withdraw_all?, reason }
export async function POST(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { upload_id, lead_ids, withdraw_all, reason, unassign_only } = await request.json()

 if (!upload_id) {
 return NextResponse.json({ error: 'upload_id is required' }, { status: 400 })
 }

 if (!withdraw_all && (!lead_ids || lead_ids.length === 0)) {
 return NextResponse.json({ error: 'lead_ids array or withdraw_all=true is required' }, { status: 400 })
 }

 let targetLeadIds: string[] = []

 if (withdraw_all) {
 // Get all leads from this upload
 const { data: allLeads } = await supabase
 .from('leads')
 .select('id')
 .eq('upload_id', upload_id)

 targetLeadIds = (allLeads || []).map((l: any) => l.id)
 } else {
 targetLeadIds = lead_ids
 }

 if (targetLeadIds.length === 0) {
 return NextResponse.json({ error: 'No leads found to withdraw' }, { status: 400 })
 }

 if (unassign_only) {
 // Just unassign users from these leads, keep them in pool
 const { error } = await supabase
 .from('leads')
 .update({
 assigned_to: null,
 assigned_date: null,
 status: 'pending',
 })
 .in('id', targetLeadIds)

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }
 } else {
 // Full withdraw: mark as rejected and unassign
 const { error } = await supabase
 .from('leads')
 .update({
 assigned_to: null,
 assigned_date: null,
 status: 'rejected',
 })
 .in('id', targetLeadIds)

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }
 }

 // Log the bulk operation
 await supabase.from('bulk_operations').insert({
 operation_type: 'withdraw',
 upload_id,
 target_user_id: null,
 lead_count: targetLeadIds.length,
 lead_ids: targetLeadIds,
 performed_by: session.user.id,
 notes: reason || (unassign_only ? 'Unassigned leads from upload' : 'Withdrawn leads from upload'),
 })

 return NextResponse.json({
 success: true,
 withdrawn_count: targetLeadIds.length,
 })
 } catch (error) {
 console.error('Withdraw error:', error)
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
