import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const BATCH_SIZE = 200

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
 .select('id')
 .single()

 if (uploadError || !upload) {
 console.error('Upload record error:', uploadError)
 return NextResponse.json({ error: uploadError?.message || 'Failed to create upload record' }, { status: 500 })
 }

 // 2. Insert leads in batches to avoid statement timeouts
 for (let i = 0; i < leads.length; i += BATCH_SIZE) {
 const batch = leads.slice(i, i + BATCH_SIZE).map((lead: string) => ({
 lead_identifier: lead,
 assigned_to: null,
 status: 'pending',
 assigned_date: null,
 upload_id: upload.id,
 }))

 const { error: leadsError } = await supabaseAdmin
 .from('leads')
 .insert(batch)

 if (leadsError) {
 console.error(`Leads insert error (batch ${i}-${i + batch.length}):`, leadsError)
 await supabaseAdmin.from('lead_uploads').delete().eq('id', upload.id)
 return NextResponse.json({ error: leadsError.message, batch: `${i}-${i + batch.length}` }, { status: 500 })
 }
 }

 // 3. Return success
 return NextResponse.json({
 success: true,
 count: leads.length,
 upload_id: upload.id,
 })
 } catch (error) {
 console.error('Upload error:', error)
 return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
 }
}
