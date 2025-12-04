'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProfilePage() {
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage('')
        setError('')

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            if (res.ok) {
                setMessage('Password updated successfully')
                setPassword('')
            } else {
                const data = await res.json()
                setError(data.error)
            }
        } catch (error) {
            setError('Failed to update password')
        }
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>

                        <Button type="submit" className="w-full">Update Password</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
