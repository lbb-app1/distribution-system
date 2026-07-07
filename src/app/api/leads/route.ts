import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const date = searchParams.get('date')
 const all = searchParams.get('all')
 const search = searchParams.get('search')
 const subStatus = searchParams.get('sub_status')
 const unassigned = searchParams.get('unassigned') === 'true'
 const page = parseInt(searchParams.get('page') || '0')
 const limit = parseInt(searchParams.get('limit') || '50')
 const sortBy = searchParams.get('sort_by') || 'created_at'
 const sortOrder = searchParams.get('sort_order') || 'desc'

 let selectQuery = '*, assigned_to(username)'
 let selectOptions: any = {}

 if (all) {
 selectOptions.count = 'exact'
 }

 let query = supabase
 .from('leads')
 .select(selectQuery, selectOptions)

 // Always apply filters first
 if (unassigned) {
 query = query.is('assigned_to', null)
 } else if (session.user.role !== 'admin') {
 query = query.eq('assigned_to', session.user.id)
 } else {
 // For admin with no unassigned filter, allow date filtering
 if (!search && !subStatus && !all && !date) {
 query = query.eq('assigned_date', date || new Date().toISOString().split('T')[0])
 }
 }

 // Search with server-side filtering
 if (search) {
 const orCondition = `lead_identifier.ilike.%${search}%,notes.ilike.%${search}%`
 query = query.or(orCondition)
 }

 // Substatus filtering
 if (subStatus) {
 if (subStatus === 'tracking') {
 query = query.not('sub_status', 'is', null')
 } else {
 query = query.eq('sub_status', subStatus)
 }
 }

 // Always apply pagination for large datasets (leads table is huge)
 const from = page * limit
 const to = from + limit - 1
 query = query.range(from, to)

 // Apply sorting with direction
 const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc'
 query = query.order(sortBy, { ascending: sortOrderValue === 'asc' })

 const { data, error, count } = await query

 if (error) {
 console.error('API Error:', error)
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({
 data,
 count,
 pagination: {
 page,
 limit,
 totalPages: Math.ceil(count / limit),
 hasNext: (page + 1) * limit < count,
 hasPrev: page > 0,
 }
 })
}

export async function POST(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { lead_identifier, notes, status, sub_status } = await request.json()

 if (!lead_identifier) {
 return NextResponse.json({ error: 'Client Name / Identifier is required' }, { status: 400 })
 }

 const newLead = {
 lead_identifier,
 assigned_to: session.user.id,
 status: status || 'pending',
 sub_status: sub_status || null,
 notes: notes || null,
 assigned_date: new Date().toISOString().split('T')[0],
 is_active_client: sub_status === 'Closed' ? true : false
 }

 const { data, error } = await supabase
 .from('leads')
 .insert(newLead)
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

export async function DELETE(request: Request) {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const id = searchParams.get('id')

 if (!id) {
 return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
 }

 try {
 const { error } = await supabase
 .from('leads')
 .delete()
 .eq('id', id)

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({ success: true })
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}