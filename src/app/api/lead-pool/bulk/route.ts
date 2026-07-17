import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const MAX_BATCH = 2000

export async function POST(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const body = await request.json()
 const { action, count, uploadId, userId, status, subStatus } = body

 // Build the same filter query the lead pool uses
 let query = supabaseAdmin.from('leads').select('id')

 if (uploadId) {
 query = query.eq('upload_id', uploadId)
 }
 if (userId) {
 query = query.eq('assigned_to', userId)
 } else {
 query = query.is('assigned_to', null)
 }
 if (status) {
 query = query.eq('status', status)
 }
 if (subStatus) {
 query = query.eq('sub_status', subStatus)
 }

 let affected = 0

 if (action === 'delete') {
 const { data: toDelete } = await query.limit(Math.min(count || MAX_BATCH, MAX_BATCH))
 if (toDelete && toDelete.length > 0) {
 const ids = toDelete.map((l: any) => l.id)
 // Delete in batches
 const BATCH = 500
 for (let i = 0; i < ids.length; i += BATCH) {
 const batch = ids.slice(i, i + BATCH)
 await supabaseAdmin.from('leads').delete().in('id', batch)
 }
 affected = toDelete.length
 }
 } else if (action === 'reassign') {
 if (!userId) {
 return NextResponse.json({ error: 'userId required for reassign' }, { status: 400 })
 }
 const { data: toUpdate } = await query.limit(Math.min(count || MAX_BATCH, MAX_BATCH))
 if (toUpdate && toUpdate.length > 0) {
 const ids = toUpdate.map((l: any) => l.id)
 const BATCH = 500
 for (let i = 0; i < ids.length; i += BATCH) {
 const batch = ids.slice(i, i + BATCH)
 await supabaseAdmin.from('leads').update({
 assigned_to: userId,
 assigned_date: new Date().toISOString().split('T')[0]
 }).in('id', batch)
 }
 affected = toUpdate.length
 }
 } else if (action === 'status') {
 if (!status) {
 return NextResponse.json({ error: 'status required' }, { status: 400 })
 }
 const { data: toUpdate } = await query.limit(Math.min(count || MAX_BATCH, MAX_BATCH))
 if (toUpdate && toUpdate.length > 0) {
 const ids = toUpdate.map((l: any) => l.id)
 const BATCH = 500
 for (let i = 0; i < ids.length; i += BATCH) {
 const batch = ids.slice(i, i + BATCH)
 await supabaseAdmin.from('leads').update({ status }).in('id', batch)
 }
 affected = toUpdate.length
 }
 } else if (action === 'unassign') {
 const { data: toUpdate } = await query.limit(Math.min(count || MAX_BATCH, MAX_BATCH))
 if (toUpdate && toUpdate.length > 0) {
 const ids = toUpdate.map((l: any) => l.id)
 const BATCH = 500
 for (let i = 0; i < ids.length; i += BATCH) {
 const batch = ids.slice(i, i + BATCH)
 await supabaseAdmin.from('leads').update({
 assigned_to: null,
 assigned_date: null
 }).in('id', batch)
 }
 affected = toUpdate.length
 }
 } else {
 return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
 }

 return NextResponse.json({ success: true, affected })
 } catch (error) {
 console.error('Bulk operation error:', error)
 return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
 }
}
