'use client'
import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HistoryPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/leads?all=true')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setLeads(data)
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
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Lead History</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Lead</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map(lead => (
                            <TableRow key={lead.id}>
                                <TableCell>{lead.assigned_date}</TableCell>
                                <TableCell className="font-medium">{lead.lead_identifier}</TableCell>
                                <TableCell>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'done' ? 'bg-green-100 text-green-800' :
                                            lead.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {leads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-4">No history found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
