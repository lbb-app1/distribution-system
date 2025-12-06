'use client'
import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function AllLeadsPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchLeads = async (pageNum: number, isSearch: boolean = false) => {
        if (pageNum === 0) setLoading(true)
        else setLoadingMore(true)

        try {
            let url = `/api/leads?all=true&page=${pageNum}&limit=50`
            if (search) {
                url += `&search=${search}`
            }
            const res = await fetch(url)
            const result = await res.json()

            if (result.data && Array.isArray(result.data)) {
                if (isSearch || pageNum === 0) {
                    setLeads(result.data)
                } else {
                    setLeads(prev => {
                        const existingIds = new Set(prev.map(p => p.id))
                        const newLeads = result.data.filter((l: any) => !existingIds.has(l.id))
                        return [...prev, ...newLeads]
                    })
                }

                setTotalCount(result.count || 0)
                setHasMore(result.data.length === 50)
            } else {
                if (pageNum === 0) setLeads([])
                setHasMore(false)
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error)
            if (pageNum === 0) setLeads([])
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    // Initial load and search
    useEffect(() => {
        setPage(0)
        const timer = setTimeout(() => {
            fetchLeads(0, true)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1
                        fetchLeads(nextPage)
                        return nextPage
                    })
                }
            },
            { threshold: 1.0 }
        )

        const sentinel = document.getElementById('sentinel')
        if (sentinel) observer.observe(sentinel)

        return () => observer.disconnect()
    }, [hasMore, loading, loadingMore, leads.length]) // Add leads.length to re-attach if needed

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold">All Assigned Leads</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads or users..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Badge variant="secondary">{totalCount} Total Leads</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Lead List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lead Identifier</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Date Assigned</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            Loading leads...
                                        </TableCell>
                                    </TableRow>
                                ) : leads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            No leads found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {leads.map((lead) => (
                                            <TableRow key={lead.id}>
                                                <TableCell className="font-medium font-mono">
                                                    {lead.lead_identifier}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                                                        {lead.assigned_to?.username || 'Unassigned'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                                        {new Date(lead.assigned_date || lead.created_at).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Sentinel for infinite scroll */}
                                        <TableRow id="sentinel">
                                            <TableCell colSpan={3} className="p-0 h-4"></TableCell>
                                        </TableRow>
                                        {loadingMore && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                    Loading more...
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
