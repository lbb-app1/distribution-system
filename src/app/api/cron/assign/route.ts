import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
 const authHeader = request.headers.get('authorization')
 if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 const { data: settings, error: settingsError } = await supabaseAdmin
 .from('auto_assign_settings')
 .select('user_id, daily_limit')
 .eq('is_enabled', true)
 .gt('daily_limit', 0)

 if (settingsError) throw settingsError
 if (!settings || settings.length === 0) {
 return NextResponse.json({ message: 'No auto-assignment tasks found' })
 }

 const userIds = settings.map((s: any) => s.user_id)
 const limits = Object.fromEntries(settings.map((s: any) => [s.user_id, s.daily_limit]))

 const { data: users, error: usersError } = await supabaseAdmin
 .from('users')
 .select('id, is_active')
 .in('id', userIds)

 if (usersError) throw usersError

 const activeUserIds = new Set(users.filter((u: any) => u.is_active).map((u: any) => u.id))

 const totalToAssign = Object.keys(limits)
 .filter(id => activeUserIds.has(id))
 .reduce((sum, id) => sum + limits[id], 0)

 if (totalToAssign === 0) {
 return NextResponse.json({ message: 'No active users with assignment enabled' })
 }

 const { data: leadsToAssign, error: fetchError } = await supabaseAdmin
 .from('leads')
 .select('id')
 .is('assigned_to', null)
 .eq('status', 'pending')
 .limit(totalToAssign)

 if (fetchError || !leadsToAssign || leadsToAssign.length === 0) {
 return NextResponse.json({ message: 'No unassigned leads available', totalAssigned: 0 })
 }

 const leadIds = leadsToAssign.map((l: any) => l.id)
 const results: any[] = []
 let leadIdx = 0
 let totalAssigned = 0

 for (const userId of Object.keys(limits)) {
 if (!activeUserIds.has(userId)) continue
 const limit = limits[userId]
 const batch = leadIds.slice(leadIdx, leadIdx + limit)
 if (batch.length === 0) break

 const { error: updateError } = await supabaseAdmin
 .from('leads')
 .update({ assigned_to: userId, assigned_date: new Date().toISOString().split('T')[0] })
 .in('id', batch)

 if (updateError) {
 results.push({ userId, assigned: 0, error: updateError.message })
 } else {
 totalAssigned += batch.length
 results.push({ userId, assigned: batch.length })
 }
 leadIdx += batch.length
 }

 return NextResponse.json({ success: true, totalAssigned, details: results })
 } catch (error) {
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
 }
}
