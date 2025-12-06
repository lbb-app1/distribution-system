'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MessageCircle, Eye, CalendarCheck, CheckCircle2, User } from 'lucide-react'

export default function AdminTrackingPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([])
    const [isGlobalSearch, setIsGlobalSearch] = useState(false)

    useEffect(() => {
        if (!search) {
            setIsGlobalSearch(false)
            fetchTrackingLeads()
        } else {
            // Debounce search? Or just search on enter? Let's search on type for now but maybe throttle
            const timer = setTimeout(() => {
                if (search.length > 2) handleGlobalSearch()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [search])

    const fetchTrackingLeads = async () => {
        const res = await fetch('/api/admin/tracking')
        const data = await res.json()
        if (Array.isArray(data)) {
            setLeads(data)
        }
    }

    const handleGlobalSearch = async () => {
        setIsGlobalSearch(true)
        const res = await fetch(`/api/admin/leads/search?q=${search}`)
        const data = await res.json()
        if (data.results) {
            setGlobalSearchResults(data.results)
        }
    }

    const columns = [
        { id: 'Replied', label: 'Replied', color: 'bg-yellow-100 dark:bg-yellow-900/20', icon: MessageCircle },
        { id: 'Seen', label: 'Seen', color: 'bg-orange-100 dark:bg-orange-900/20', icon: Eye },
        { id: 'Booked', label: 'Booked', color: 'bg-blue-100 dark:bg-blue-900/20', icon: CalendarCheck },
        { id: 'Closed', label: 'Closed', color: 'bg-green-100 dark:bg-green-900/20', icon: CheckCircle2 },
    ]

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Global Tracking & Search</h1>
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search any lead..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {isGlobalSearch ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Search Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {globalSearchResults.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No leads found.</div>
                        ) : (
                            <div className="space-y-2">
                                {globalSearchResults.map(lead => (
                                    <div key={lead.id} className="flex justify-between items-center p-3 border rounded-md">
                                        <div>
                                            <div className="font-medium">{lead.lead_identifier}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Status: {lead.status} {lead.sub_status && `(${lead.sub_status})`}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Assigned: {new Date(lead.assigned_date || lead.created_at).toLocaleDateString()}
                                            </div>
                                            {lead.notes && <div className="text-xs italic mt-1">"{lead.notes}"</div>}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <User className="w-4 h-4 mr-2" />
                                            {lead.assigned_to?.username || 'Unassigned'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
                    {columns.map(col => {
                        const columnLeads = leads.filter(l => l.sub_status === col.id)
                        return (
                            <div key={col.id} className={`flex-1 min-w-[300px] rounded-lg border p-4 ${col.color}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold flex items-center">
                                        <col.icon className="w-4 h-4 mr-2" />
                                        {col.label}
                                    </h3>
                                    <Badge variant="secondary">{columnLeads.length}</Badge>
                                </div>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {columnLeads.map(lead => (
                                        <Card key={lead.id} className="bg-background shadow-sm">
                                            <CardContent className="p-3">
                                                <div className="font-medium truncate">{lead.lead_identifier}</div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <User className="w-3 h-3 mr-1" />
                                                        {lead.assigned_to?.username}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(lead.assigned_date || lead.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {lead.notes && (
                                                    <div className="mt-2 text-xs italic bg-muted/50 p-1 rounded">
                                                        "{lead.notes}"
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
