import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/lead-pool/uploads - get all lead uploads with counts
// POST /api/lead-pool/uploads - create a new upload (duplicate of /api/leads/upload)
export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const activeOnly = searchParams.get('active') === 'true'

 let query = supabaseAdmin
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
 .order('uploaded_at', { ascending: false })

 if (activeOnly) {
 query = query.eq('is_active', true)
 }

 const { data, error } = await query

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 // Format data nicely
 const formattedData = (data || []).map((upload: any) => ({
 ...upload,
 uploader: (upload.uploader as any)?.username || 'Unknown',
 uploaded_at: new Date(upload.uploaded_at).toISOString(),
 upload_percentage: upload.lead_count > 0 ? Math.round((upload.assigned_count / upload.lead_count) * 100) : 0,
 }))

 return NextResponse.json(formattedData)
}

export async function POST(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { leads, fileName, displayName } = await request.json()

 if (!leads || leads.length === 0) {
 return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
 }

 // 1. Create upload record
 const { data: upload, error: uploadError } = await supabaseAdmin
 .from('lead_uploads')
 .insert({
 file_name: fileName || 'unknown',
 display_name: displayName || fileName || 'unknown',
 uploaded_by: session.user.id,
 lead_count: leads.length,
 })
 .select()
 .single()

 if (uploadError || !upload) {
 return NextResponse.json({ error: uploadError?.message || 'Failed to create upload record' }, { status: 500 })
 }

 // 2. Insert leads with the upload_id reference
 const assignments = leads.map((lead: string) => ({
 lead_identifier: lead,
 assigned_to: null,
 status: 'pending',
 assigned_date: null,
 upload_id: upload.id,
 }))

 const { error: leadsError } = await supabaseAdmin
 .from('leads')
 .insert(assignments)

 if (leadsError) {
 // Rollback: delete the upload record
 await supabaseAdmin.from('lead_uploads').delete().eq('id', upload.id)
 return NextResponse.json({ error: leadsError.message }, { status: 500 })
 }

 return NextResponse.json({
 success: true,
 count: assignments.length,
 upload_id: upload.id,
 })
 } catch (error) {
 console.error('Upload error:', error)
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
