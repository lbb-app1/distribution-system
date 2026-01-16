import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')
        const refDate = dateParam ? new Date(dateParam) : new Date()

        // Calculate Start of Week (Monday 9:00 AM) relative to refDate
        // If refDate is Monday < 9am, it belongs to previous week.
        const day = refDate.getDay() // 0=Sun, 1=Mon, ... 6=Sat

        let startOfWeek = new Date(refDate)
        const diff = (day + 6) % 7 // Days since Monday (Mon=0, Tue=1... Sun=6)
        startOfWeek.setDate(refDate.getDate() - diff)
        startOfWeek.setHours(9, 0, 0, 0)
        startOfWeek.setMinutes(0, 0, 0) // Ensure clean minutes/seconds

        // If reference is Monday but before 9am, we go back one more week
        if (day === 1 && refDate.getHours() < 9) {
            startOfWeek.setDate(startOfWeek.getDate() - 7)
        } else if (refDate < startOfWeek) {
            startOfWeek.setDate(startOfWeek.getDate() - 7)
        }

        // End of Week is Start + 7 days
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 7)

        // Fetch Activity Logs (for time spent and recent strict updates)
        const { data: logs, error: logError } = await supabase
            .from('activity_logs')
            .select('user_id, points, action_type, created_at, users(username)')
            .gte('created_at', startOfWeek.toISOString())
            .lt('created_at', endOfWeek.toISOString())

        if (logError) console.error('Log Error:', logError)

        // Fetch Leads Assigned/Closed in this range
        const { data: leads, error: leadError } = await supabase
            .from('leads')
            .select('assigned_to, status, sub_status, notes, assigned_date, users:assigned_to(username)')
            .gte('assigned_date', startOfWeek.toISOString().split('T')[0])
            .lte('assigned_date', endOfWeek.toISOString().split('T')[0]) // assigned_date is just date, so lte covers "until end of week" broadly


        if (leadError) console.error('Lead Error:', leadError)

        // Aggregation
        const leaderboard: Record<string, {
            username: string,
            points: number,
            timeSpent: number,
            tasks: number,
            closed: number
        }> = {}

        // Helper to init user
        const initUser = (uid: string, username: string) => {
            if (!leaderboard[uid]) {
                leaderboard[uid] = {
                    username: username || 'Unknown',
                    points: 0,
                    timeSpent: 0,
                    tasks: 0,
                    closed: 0
                }
            }
        }

        // 1. Process Logs (Time Spent & Real-time updates)
        logs?.forEach((log: any) => {
            const uid = log.user_id
            if (!uid) return
            initUser(uid, log.users?.username)

            if (log.action_type === 'time_spent') {
                leaderboard[uid].points += (log.points || 0)
                leaderboard[uid].timeSpent += 1
            } else if (log.action_type === 'lead_update') {
                // We actually want to prioritize the "Leads Table" scan for tasks to avoid double counting 
                // IF we are backfilling. 
                // BUT: Activity Log is "Action happened NOW". Leads table is "State is X".
                // If a user updates a lead assigned LAST week, it shows in logs but not in "Leads Assigned This Week".
                // So Logs are additive for "Non-this-week-assigned" leads?
                // Complication: Double counting. 
                // Solution for now: Use Logs ONLY for Time Spent. 
                // AND Use Leads Table for ALL lead status points for this week's cohort.
                // LIMITATION: Updates to OLD leads won't count towards this week's score in this iteration, 
                // but moving forward we could rely purely on logs. 
                // FOR USER REQUEST: "Tasks which were already assigned... completed".
                // So we stick to scanning the Leads table for the BASE score.
                // We will IGNORE 'lead_update' from logs for the *score* to avoid complexity of deduplication right now,
                // OR we just use logs for time.
                // Let's use Logs ONLY for Time Spent to keep it clean and robust for the "Backfill" requirement.
            }
        })

        // 2. Process Leads (The "Work" - Backfill & Current State)
        leads?.forEach((lead: any) => {
            const uid = lead.assigned_to
            if (!uid) return
            // lead.users might be an array or object depending on join, usually object if single
            const username = Array.isArray(lead.users) ? lead.users[0]?.username : lead.users?.username
            initUser(uid, username)

            let p = 0
            if (lead.status === 'done') {
                p += 5
                leaderboard[uid].tasks += 1
            }
            if (lead.status === 'rejected') {
                p += 1
                leaderboard[uid].tasks += 1
            }

            if (lead.sub_status === 'Replied') p += 10
            if (lead.sub_status === 'Booked') p += 50
            if (lead.sub_status === 'Closed') {
                p += 100
                leaderboard[uid].closed += 1
            }

            if (lead.notes) p += 2

            leaderboard[uid].points += p
        })

        const sorted = Object.values(leaderboard).sort((a, b) => b.points - a.points)

        return NextResponse.json(sorted)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
