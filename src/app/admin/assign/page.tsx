'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Upload, Users, Settings, RefreshCw } from 'lucide-react'

export default function AssignLeadsPage() {
    const [activeTab, setActiveTab] = useState('upload')
    const [balance, setBalance] = useState(0)

    // Upload State
    const [file, setFile] = useState<File | null>(null)
    const [leads, setLeads] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    // Manual Assign State
    const [users, setUsers] = useState<any[]>([])
    const [manualAssignments, setManualAssignments] = useState<{ [key: string]: number }>({})
    const [assigning, setAssigning] = useState(false)

    // Auto Assign State
    const [autoSettings, setAutoSettings] = useState<any[]>([])
    const [savingSettings, setSavingSettings] = useState(false)

    useEffect(() => {
        fetchBalance()
        fetchUsers()
        fetchAutoSettings()
    }, [])

    const fetchBalance = async () => {
        const res = await fetch('/api/leads/balance', { cache: 'no-store', credentials: 'include' })
        const data = await res.json()
        if (data.count !== undefined) setBalance(data.count)
    }

    const fetchUsers = async () => {
        const res = await fetch('/api/users', { cache: 'no-store', credentials: 'include' })
        const data = await res.json()
        if (Array.isArray(data)) {
            setUsers(data.filter((u: any) => u.role === 'user' && u.is_active))
        }
    }

    const fetchAutoSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/auto-assign', { cache: 'no-store', credentials: 'include' })
            if (!res.ok) {
                if (res.status === 401) {
                    console.log('Auto-assign settings fetch returned 401, redirecting to login')
                    window.location.href = '/login'
                    return
                }
                const err = await res.json()
                console.error('Failed to fetch auto settings:', err)
                return
            }
            const data = await res.json()
            if (Array.isArray(data)) {
                setAutoSettings(data)
            }
        } catch (e) {
            console.error('Error fetching auto settings:', e)
        }
    }

    // --- Upload Logic ---
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
                    toast.success(`Parsed ${parsedLeads.length} leads`)
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
                toast.success(`Parsed ${parsedLeads.length} leads`)
            }
            reader.readAsBinaryString(file)
        }
    }

    const handleUpload = async () => {
        if (leads.length === 0) return
        setUploading(true)
        try {
            const res = await fetch('/api/leads/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads, userIds: [] }), // userIds empty = no assignment
            })
            if (res.ok) {
                toast.success('Leads uploaded to balance')
                setLeads([])
                setFile(null)
                fetchBalance()
            } else {
                toast.error('Upload failed')
            }
        } catch (error) {
            toast.error('Error uploading leads')
        } finally {
            setUploading(false)
        }
    }

    // --- Manual Assign Logic ---
    const handleManualAssignChange = (userId: string, val: string) => {
        const count = parseInt(val) || 0
        setManualAssignments(prev => ({ ...prev, [userId]: count }))
    }

    const distributeEvenly = (amount: number) => {
        if (users.length === 0) return
        const perUser = Math.floor(amount / users.length)
        const newAssignments: any = {}
        users.forEach(u => newAssignments[u.id] = perUser)
        setManualAssignments(newAssignments)
    }

    const executeManualAssign = async () => {
        const assignments = Object.entries(manualAssignments).map(([userId, count]) => ({ userId, count }))
        const totalRequested = assignments.reduce((acc, curr) => acc + curr.count, 0)

        if (totalRequested === 0) {
            toast.error('No assignments specified')
            return
        }
        if (totalRequested > balance) {
            toast.error(`Insufficient balance. You have ${balance}, but tried to assign ${totalRequested}.`)
            return
        }

        setAssigning(true)
        try {
            const res = await fetch('/api/leads/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments }),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(`Assigned ${data.count} leads successfully`)
                setManualAssignments({})
                fetchBalance()
            } else {
                toast.error(data.error || 'Assignment failed')
            }
        } catch (error) {
            toast.error('Error assigning leads')
        } finally {
            setAssigning(false)
        }
    }

    // --- Auto Assign Logic ---
    const handleAutoSettingChange = (userId: string, field: string, value: any) => {
        setAutoSettings(prev => prev.map(s => s.id === userId ? { ...s, [field]: value } : s))
    }

    const saveAutoSettings = async () => {
        setSavingSettings(true)
        try {
            const payload = autoSettings.map(s => ({
                userId: s.id,
                daily_limit: s.daily_limit,
                is_enabled: s.is_enabled
            }))

            const res = await fetch('/api/admin/settings/auto-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: payload }),
                credentials: 'include'
            })
            if (res.ok) {
                toast.success('Settings saved')
            } else {
                const err = await res.json()
                console.error('Failed to save settings:', err)
                toast.error(`Failed to save settings: ${err.error || 'Unknown error'}`)
            }
        } catch (error) {
            toast.error('Error saving settings')
        } finally {
            setSavingSettings(false)
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Lead Distribution</h2>
                    <p className="text-muted-foreground mt-1">Manage lead pool and assignments.</p>
                </div>
                <Card className="w-48 bg-primary/10 border-primary/20">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Lead Balance</span>
                        <span className="text-3xl font-bold text-primary">{balance}</span>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upload">Upload Leads</TabsTrigger>
                    <TabsTrigger value="manual">Manual Assignment</TabsTrigger>
                    <TabsTrigger value="auto">Auto-Assignment</TabsTrigger>
                </TabsList>

                {/* Upload Tab */}
                <TabsContent value="upload" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Upload className="w-5 h-5 mr-2" />
                                Upload to Pool
                            </CardTitle>
                            <CardDescription>Upload CSV/Excel files to add leads to the balance pool.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="file">Lead File</Label>
                                <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                            </div>
                            {leads.length > 0 && (
                                <div className="p-4 bg-muted/50 rounded-md text-sm">
                                    <span className="font-semibold text-primary">{leads.length}</span> leads ready to upload.
                                </div>
                            )}
                            <Button onClick={handleUpload} disabled={uploading || leads.length === 0}>
                                {uploading ? 'Uploading...' : 'Add to Balance'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Manual Assignment Tab */}
                <TabsContent value="manual" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    Assign to Users
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => distributeEvenly(50)}>50 Each</Button>
                                    <Button variant="outline" size="sm" onClick={() => distributeEvenly(100)}>100 Each</Button>
                                    <Button variant="outline" size="sm" onClick={() => setManualAssignments({})}>Clear</Button>
                                </div>
                            </CardTitle>
                            <CardDescription>Manually distribute leads from the balance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                        <div className="font-medium">{user.username}</div>
                                        <div className="flex items-center space-x-2">
                                            <Label className="text-xs text-muted-foreground">Count:</Label>
                                            <Input
                                                type="number"
                                                className="w-24 h-8"
                                                min="0"
                                                value={manualAssignments[user.id] || ''}
                                                onChange={(e) => handleManualAssignChange(user.id, e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={executeManualAssign} disabled={assigning}>
                                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Auto Assignment Tab */}
                <TabsContent value="auto" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Settings className="w-5 h-5 mr-2" />
                                Daily Auto-Assignment
                            </CardTitle>
                            <CardDescription>Configure how many leads each user receives automatically at 9:00 AM IST.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {autoSettings.map(setting => (
                                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-md bg-card">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{setting.username}</span>
                                            <span className="text-xs text-muted-foreground">Daily Limit</span>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    type="number"
                                                    className="w-24"
                                                    value={setting.daily_limit}
                                                    onChange={(e) => handleAutoSettingChange(setting.id, 'daily_limit', parseInt(e.target.value) || 0)}
                                                />
                                                <span className="text-sm text-muted-foreground">leads</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={setting.is_enabled}
                                                    onCheckedChange={(val) => handleAutoSettingChange(setting.id, 'is_enabled', val)}
                                                />
                                                <Label>{setting.is_enabled ? 'Active' : 'Inactive'}</Label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={saveAutoSettings} disabled={savingSettings}>
                                    {savingSettings ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
