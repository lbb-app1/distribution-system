import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
 const session = await getSession()
 if (!session || session.user.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { data, error } = await supabaseAdmin
 .rpc('get_analytics_summary')

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json(data)
}
