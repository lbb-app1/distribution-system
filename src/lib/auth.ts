import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const getSecretKey = () => {
    const secret = process.env.JWT_SECRET_KEY
    if (!secret) {
        console.error('JWT_SECRET_KEY is not set')
    } else {
        // console.log('JWT_SECRET_KEY is set (length:', secret.length, ')')
    }
    return new TextEncoder().encode(secret || 'your-secret-key')
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getSecretKey())
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, getSecretKey(), {
        algorithms: ['HS256'],
    })
    return payload
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return null
    try {
        return await decrypt(session)
    } catch (error) {
        return null
    }
}

export async function createSession(userData: any) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ user: userData, expires })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        expires,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', { expires: new Date(0), path: '/' })
}
