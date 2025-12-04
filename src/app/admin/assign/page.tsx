'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AssignLeadsPage() {
    const [file, setFile] = useState<File | null>(null)
    const [leads, setLeads] = useState<string[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data.filter((u: any) => u.role === 'user' && u.is_active))
                }
            })
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseFile(selectedFile)
        }
    }

    const parseFile = (file: File) => {
        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                complete: (results) => {
                    const parsedLeads = (results.data as any[]).flat().filter((l: any) => l && typeof l === 'string' && l.trim() !== '') as string[]
                    setLeads(parsedLeads)
                },
                header: false
            })
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]
                const parsedLeads = parsedData.flat().filter((l: any) => l && typeof l === 'string' && l.trim() !== '')
                setLeads(parsedLeads)
            }
            reader.readAsBinaryString(file)
        }
    }

    const handleAssign = async () => {
        if (leads.length === 0) {
            setMessage('No leads to assign')
            return
        }
        setLoading(true)
        setMessage('')

        try {
            const res = await fetch('/api/leads/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads, userIds: selectedUsers }),
            })
            const data = await res.json()
            if (res.ok) {
                setMessage(`Successfully assigned ${data.count} leads`)
                setLeads([])
                setFile(null)
                // Reset file input if possible or just let it be
            } else {
                setMessage(`Error: ${data.error}`)
            }
        } catch (error) {
            setMessage('Failed to assign leads')
        } finally {
            setLoading(false)
        }
    }

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Leads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                    {leads.length > 0 && (
                        <p className="text-sm text-gray-500">Found {leads.length} leads</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Select Users to Distribute</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={user.id}
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={() => toggleUser(user.id)}
                                />
                                <Label htmlFor={user.id}>{user.username}</Label>
                            </div>
                        ))}
                    </div>
                    {users.length === 0 && <p>No active users found.</p>}
                </CardContent>
            </Card>

            {message && (
                <Alert>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            )}

            <Button onClick={handleAssign} disabled={loading || leads.length === 0} className="w-full">
                {loading ? 'Assigning...' : 'Auto Assign Leads'}
            </Button>
        </div>
    )
}
