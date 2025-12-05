import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    // Verify Cron Secret (Optional but recommended for security)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 1. Get enabled settings
        const { data: settings, error: settingsError } = await supabase
            .from('auto_assign_settings')
            .select('user_id, daily_limit')
            .eq('is_enabled', true)
            .gt('daily_limit', 0)

        if (settingsError) throw settingsError
        if (!settings || settings.length === 0) {
            return NextResponse.json({ message: 'No auto-assignment tasks found' })
        }

        let totalAssigned = 0
        const results = []

        // 2. Process each user
        for (const setting of settings) {
            // Check if user is active
            const { data: user } = await supabase
                .from('users')
                .select('is_active')
                .eq('id', setting.user_id)
                .single()

            if (!user || !user.is_active) continue

            // Fetch unassigned leads
            const { data: leadsToAssign, error: fetchError } = await supabase
                .from('leads')
                .select('id')
                .is('assigned_to', null)
                .limit(setting.daily_limit)

            if (fetchError || !leadsToAssign || leadsToAssign.length === 0) {
                results.push({ userId: setting.user_id, assigned: 0, status: 'No leads available' })
                continue
            }

            const leadIds = leadsToAssign.map(l => l.id)

            // Assign leads
            const { error: updateError } = await supabase
                .from('leads')
                .update({
                    assigned_to: setting.user_id,
                    assigned_date: new Date().toISOString().split('T')[0]
                })
                .in('id', leadIds)

            if (updateError) {
                results.push({ userId: setting.user_id, error: updateError.message })
            } else {
                totalAssigned += leadIds.length
                results.push({ userId: setting.user_id, assigned: leadIds.length })
            }
        }

        return NextResponse.json({ success: true, totalAssigned, details: results })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
