import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ uploadId: string }> }) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { uploadId } = await params
 const { searchParams } = new URL(request.url)
 const includeLeads = searchParams.get('leads') === 'true'

 const { data: upload, error } = await supabase
 .from('lead_uploads')
 .select(`
 id,
 file_name,
 display_name,
 uploaded_by,
 uploaded_at,
 lead_count,
 assigned_count,
 pending_count,
 done_count,
 rejected_count,
 is_active,
 uploader:users(id, username)
 `)
 .eq('id', uploadId)
 .single()

 if (error || !upload) {
 return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
 }

 const uploaderData = upload.uploader as any
 const result: any = {
 ...upload,
 uploader: uploaderData?.username || 'Unknown',
 uploaded_at: new Date(upload.uploaded_at).toISOString(),
 upload_percentage: upload.lead_count > 0 ? Math.round((upload.assigned_count / upload.lead_count) * 100) : 0,
 }

 if (includeLeads) {
 const { data: leads } = await supabase
 .from('leads')
 .select(`
 id,
 lead_identifier,
 status,
 sub_status,
 assigned_to,
 assigned_date,
 created_at,
 assignee:users!leads_assigned_to_fkey(id, username)
 `)
 .eq('upload_id', uploadId)
 .order('lead_identifier', { ascending: true })

 result.leads = (leads || []).map((lead: any) => ({
 ...lead,
 assignee: lead.assignee?.username || 'Unassigned',
 }))
 }

 return NextResponse.json(result)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ uploadId: string }> }) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { uploadId } = await params
 const { displayName, isActive } = await request.json()

 const updates: Record<string, any> = {}
 if (displayName !== undefined) updates.display_name = displayName
 if (isActive !== undefined) updates.is_active = isActive

 if (Object.keys(updates).length === 0) {
 return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
 }

 const { data, error } = await supabase
 .from('lead_uploads')
 .update(updates)
 .eq('id', uploadId)
 .select()
 .single()

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json(data)
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ uploadId: string }> }) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { uploadId } = await params

 const { data: upload } = await supabase
 .from('lead_uploads')
 .select('lead_count, display_name')
 .eq('id', uploadId)
 .single()

 await supabase.from('bulk_operations').insert({
 operation_type: 'archive',
 upload_id: uploadId,
 performed_by: session.user.id,
 notes: `Archived upload: ${upload?.display_name || uploadId}`,
 })

 const { error } = await supabase
 .from('lead_uploads')
 .update({ is_active: false })
 .eq('id', uploadId)

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 await supabase
 .from('leads')
 .update({ upload_id: null, status: 'rejected' })
 .eq('upload_id', uploadId)

 return NextResponse.json({ success: true, message: 'Upload archived and leads unlinked' })
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
