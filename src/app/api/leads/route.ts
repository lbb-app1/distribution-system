import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

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

    // User requested "all assigned leads" (and unassigned now), so we use LEFT join (standard).
    // assigned_to(username) is a left join by default in Supabase/PostgREST unless !inner is used.
    let selectQuery = '*, assigned_to(username)'
    let selectOptions: any = {}

    if (all) {
        selectOptions.count = 'exact'
    }

    let query = supabase
        .from('leads')
        .select(selectQuery, selectOptions)

    // Filters
    if (!all) {
        if (!search && !subStatus) {
            query = query.eq('assigned_date', date || new Date().toISOString().split('T')[0])
        }
    }

    if (session.user.role !== 'admin') {
        query = query.eq('assigned_to', session.user.id)
    }

    if (search) {
        // PostgREST limitation: OR across tables is hard.
        // We will prioritize searching lead_identifier.
        // If we want to search username, we might need to find the user IDs first.

        // Strategy:
        // 1. Find user IDs matching the username search.
        // 2. Filter leads where lead_identifier matches OR assigned_to is in those IDs.

        const { data: users } = await supabase
            .from('users')
            .select('id')
            .ilike('username', `%${search}%`)

        const userIds = users?.map(u => u.id) || []

        let orCondition = `lead_identifier.ilike.%${search}%`
        if (userIds.length > 0) {
            orCondition += `,assigned_to.in.(${userIds.join(',')})`
        }

        query = query.or(orCondition)
    }

    if (subStatus) {
        if (subStatus === 'tracking') {
            query = query.not('sub_status', 'is', null)
        } else {
            query = query.eq('sub_status', subStatus)
        }
    }

    // Pagination and Sorting
    if (all) {
        const page = parseInt(searchParams.get('page') || '0')
        const limit = parseInt(searchParams.get('limit') || '50')
        const from = page * limit
        const to = from + limit - 1

        query = query.range(from, to)
        query = query.order('lead_identifier', { ascending: true })

        const { data, error, count } = await query

        if (error) {
            console.error('API Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data, count })
    }

    const { data, error } = await query

    if (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
