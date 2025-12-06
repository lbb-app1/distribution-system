'use client'
import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HistoryPage() {
    const [groupedLeads, setGroupedLeads] = useState<{ [date: string]: any[] }>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/leads?all=true')
                const data = await res.json()
                if (Array.isArray(data)) {
                    // Group by date
                    const groups: { [date: string]: any[] } = {}
                    data.forEach((lead: any) => {
                        const date = lead.assigned_date || (lead.created_at ? lead.created_at.split('T')[0] : 'Unknown')
                        if (!groups[date]) {
                            groups[date] = []
                        }
                        groups[date].push(lead)
                    })

                    // Sort dates descending
                    const sortedGroups: { [date: string]: any[] } = {}
                    Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).forEach(key => {
                        sortedGroups[key] = groups[key]
                    })

                    setGroupedLeads(sortedGroups)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Lead History</h2>
                <p className="text-muted-foreground mt-1">View all your past assigned leads.</p>
            </div>

            <div className="space-y-8">
                {Object.entries(groupedLeads).map(([date, leads]) => (
                    <div key={date} className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground">
                                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                {leads.length} leads
                            </span>
                        </div>

                        <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead>Lead Identifier</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map(lead => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium font-mono text-sm">{lead.lead_identifier}</TableCell>
                                            <TableCell>
                                                <div className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                    lead.status === 'done' && "bg-green-50 text-green-700 border-green-200",
                                                    lead.status === 'rejected' && "bg-red-50 text-red-700 border-red-200",
                                                    lead.status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                )}>
                                                    {lead.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                    {lead.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                                    {lead.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                                    <span className="capitalize">{lead.status}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}

                {Object.keys(groupedLeads).length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No history available.
                    </div>
                )}
            </div>
        </div>
    )
}
