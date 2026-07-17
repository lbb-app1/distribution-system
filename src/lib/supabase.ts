import { createClient } from '@supabase/supabase-js'

// Lazy-initialized clients via Proxy to prevent module-load crashes
// when SUPABASE_SERVICE_ROLE_KEY is not yet configured during SSR build.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
let supabaseClient: any = null
let supabaseAdminClient: any = null

export const supabase = new Proxy({} as any, {
 get(target, prop) {
 if (!supabaseClient) {
 if (!supabaseUrl || !supabaseKey) {
 throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.')
 }
 supabaseClient = createClient(supabaseUrl, supabaseKey)
 }
 return supabaseClient[prop]
 }
})

export const supabaseAdmin = new Proxy({} as any, {
 get(target, prop) {
 if (!supabaseAdminClient) {
 const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
 if (!serviceRoleKey) {
 throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in your environment variables.')
 }
 if (!supabaseUrl) {
 throw new Error('NEXT_PUBLIC_SUPABASE_URL is required.')
 }
 supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey)
 }
 return supabaseAdminClient[prop]
 }
})
