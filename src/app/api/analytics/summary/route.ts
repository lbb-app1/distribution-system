import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch daily leads uploaded vs completed
    const { data: leads } = await supabase
        .from('leads')
        .select('assigned_date, status')

    // Group by date
    const dailyStats: any = {}
    leads?.forEach((lead: any) => {
        const date = lead.assigned_date
        if (!dailyStats[date]) {
            dailyStats[date] = { date, uploaded: 0, completed: 0 }
        }
        dailyStats[date].uploaded++
        if (lead.status === 'done') {
            dailyStats[date].completed++
        }
    })

    // Fetch user performance
    const { data: userLeads } = await supabase
        .from('leads')
        .select('assigned_to, status, users(username)')

    const userStats: any = {}
    userLeads?.forEach((lead: any) => {
        if (!lead.assigned_to) return // Skip unassigned leads
        const username = lead.users?.username || 'Unknown'
        if (!userStats[username]) {
            userStats[username] = { username, assigned: 0, completed: 0 }
        }
        userStats[username].assigned++
        if (lead.status === 'done') {
            userStats[username].completed++
        }
    })

    return NextResponse.json({
        daily: Object.values(dailyStats).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        userPerformance: Object.values(userStats)
    })
}
