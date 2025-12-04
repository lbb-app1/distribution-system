'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Copy } from 'lucide-react'

export default function UserDashboard() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/leads?date=' + new Date().toISOString().split('T')[0])
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

    useEffect(() => {
        fetchLeads()
    }, [])

    const handleStatusUpdate = async (id: string, status: 'done' | 'rejected') => {
        try {
            const res = await fetch(`/api/leads/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (res.ok) {
                fetchLeads()
            }
        } catch (error) {
            console.error('Failed to update status')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Today's Leads</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map(lead => (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.lead_identifier}</TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(lead.lead_identifier)}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        {lead.status === 'pending' && (
                                            <>
                                                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(lead.id, 'done')}>
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleStatusUpdate(lead.id, 'rejected')}>
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
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
                                <TableCell colSpan={3} className="text-center py-4">No leads assigned for today.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
