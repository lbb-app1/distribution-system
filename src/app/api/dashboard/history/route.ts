import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(request.url)
 const userId = searchParams.get('user_id')
 const date = searchParams.get('date')

 let query = supabaseAdmin
 .from('leads')
 .select('id, lead_identifier, status, assigned_date')
 .not('assigned_date', 'is', null)
 .order('assigned_date', { ascending: false })

 if (session.user.role !== 'admin') {
 query = query.eq('assigned_to', session.user.id)
 } else if (userId) {
 query = query.eq('assigned_to', userId)
 }

 if (date) {
 query = query.eq('assigned_date', date)
 }

 const { data, error } = await query
 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 const groups: Record<string, any[]> = {}
 data?.forEach((lead: any) => {
 const d = lead.assigned_date
 if (!groups[d]) groups[d] = []
 groups[d].push(lead)
 })

 return NextResponse.json(groups)
}
