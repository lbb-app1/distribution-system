'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Upload, UserCheck } from 'lucide-react'

export default function AssignLeadsPage() {
    const [file, setFile] = useState<File | null>(null)
    const [leads, setLeads] = useState<string[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

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
                    toast.success(`Parsed ${parsedLeads.length} leads from CSV`)
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
                toast.success(`Parsed ${parsedLeads.length} leads from Excel`)
            }
            reader.readAsBinaryString(file)
        }
    }

    const handleAssign = async () => {
        if (leads.length === 0) {
            toast.error('No leads to assign')
            return
        }
        setLoading(true)

        try {
            const res = await fetch('/api/leads/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads, userIds: selectedUsers }),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(`Successfully assigned ${data.count} leads`)
                setLeads([])
                setFile(null)
                // Reset file input visually if needed, but simplistic approach is fine
            } else {
                toast.error(`Error: ${data.error}`)
            }
        } catch (error) {
            toast.error('Failed to assign leads')
        } finally {
            setLoading(false)
        }
    }

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    const selectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(users.map(u => u.id))
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Assign Leads</h2>
                <p className="text-muted-foreground mt-1">Upload a file and distribute leads among your team.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Upload className="w-5 h-5 mr-2" />
                            Upload File
                        </CardTitle>
                        <CardDescription>Supported formats: CSV, Excel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="file">Lead File</Label>
                            <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                        </div>
                        {leads.length > 0 && (
                            <div className="p-4 bg-muted/50 rounded-md text-sm">
                                <span className="font-semibold text-primary">{leads.length}</span> leads ready to assign.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                                <UserCheck className="w-5 h-5 mr-2" />
                                Select Users
                            </div>
                            <Button variant="ghost" size="sm" onClick={selectAllUsers}>
                                {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </CardTitle>
                        <CardDescription>Choose who receives these leads</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                    <Checkbox
                                        id={user.id}
                                        checked={selectedUsers.includes(user.id)}
                                        onCheckedChange={() => toggleUser(user.id)}
                                    />
                                    <Label htmlFor={user.id} className="flex-1 cursor-pointer font-medium">{user.username}</Label>
                                </div>
                            ))}
                            {users.length === 0 && <p className="text-sm text-muted-foreground">No active users found.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={handleAssign}
                    disabled={loading || leads.length === 0}
                    size="lg"
                    className="w-full md:w-auto min-w-[200px]"
                >
                    {loading ? 'Assigning...' : 'Auto Assign Leads'}
                </Button>
            </div>
        </div>
    )
}
