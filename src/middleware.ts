import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    // Public paths
    if (request.nextUrl.pathname === '/login') {
        if (session) {
            // If already logged in, redirect to appropriate dashboard
            // We can't easily check role here without decrypting, so we'll decrypt
            try {
                const payload = await decrypt(session)
                // console.log('Middleware: Decrypted payload:', payload)
                if (payload?.user?.role === 'admin') {
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
                } else {
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }
            } catch (e) {
                // Invalid session, let them stay on login
            }
        }
        return NextResponse.next()
    }

    // Protected paths
    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const payload = await decrypt(session)

        // Admin routes protection
        if (request.nextUrl.pathname.startsWith('/admin')) {
            if (payload?.user?.role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }

        // User routes protection (optional, maybe prevent admin from seeing user dashboard?)
        // For now, allow admin to see everything or just stick to their dashboard.

        return NextResponse.next()
    } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}
