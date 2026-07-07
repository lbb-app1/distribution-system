'use client'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
 Database,
 Search,
 RefreshCw,
 Trash2,
 Edit,
 ArrowUpDown,
 ChevronLeft,
 ChevronRight,
 CheckCircle2,
 XCircle,
 Filter,
 Upload,
 List,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Lead {
 id: string
 lead_identifier: string
 status: string
 sub_status: string | null
 notes: string | null
 assigned_to: string | null
 assigned_date: string | null
 created_at: string
 upload_id: string | null
}

type SortField = 'lead_identifier' | 'created_at' | 'status'
type SortDir = 'asc' | 'desc'

const ITEMS_PER_PAGE = 50

export default function LeadPoolPage() {
 const [leads, setLeads] = useState<Lead[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [sortField, setSortField] = useState<SortField>('created_at')
 const [sortDir, setSortDir] = useState<SortDir>('desc')
 const [page, setPage] = useState(0)
 const [totalCount, setTotalCount] = useState(0)
 const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
 const [editLead, setEditLead] = useState<Lead | null>(null)
 const [editIdentifier, setEditIdentifier] = useState('')
 const [editNotes, setEditNotes] = useState('')
 const [deleteConfirm, setDeleteConfirm] = useState(false)
 const [leadToDelete, setLeadToDelete] = useState<string | null>(null)

 const fetchLeads = async () => {
 setLoading(true)
 try {
 const res = await fetch('/api/leads?unassigned=true')
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setLeads(data.data || [])
 setTotalCount(data.count || 0)
 } catch (error) {
 console.error('Failed to fetch leads:', error)
 toast.error('Failed to load lead pool')
 } finally {
 setLoading(false)
 }
 }

 const handleSort = (field: SortField) => {
 if (sortField === field) {
 setSortDir(d => d === 'asc' ? 'desc' : 'asc')
 } else {
 setSortField(field)
 setSortDir('asc')
 }
 }

 const filtered = useMemo(() => {
 let result = leads
 if (search) {
 const lower = search.toLowerCase()
 result = result.filter(l =>
 l.lead_identifier.toLowerCase().includes(lower) ||
 (l.notes && l.notes.toLowerCase().includes(lower))
 )
 }
 return [...result].sort((a, b) => {
 let cmp = 0
 if (sortField === 'lead_identifier') {
 cmp = a.lead_identifier.localeCompare(b.lead_identifier)
 } else if (sortField === 'created_at') {
 cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
 } else if (sortField === 'status') {
 cmp = a.status.localeCompare(b.status)
 }
 return sortDir === 'asc' ? cmp : -cmp
 })
 }, [leads, search, sortField, sortDir])

 const paginated = useMemo(() => {
 const start = page * ITEMS_PER_PAGE
 return filtered.slice(start, start + ITEMS_PER_PAGE)
 }, [filtered, page])

 const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

 const toggleSelect = (id: string) => {
 const next = new Set(selectedLeads)
 if (next.has(id)) next.delete(id)
 else next.add(id)
 setSelectedLeads(next)
 }

 const toggleSelectAll = () => {
 if (selectedLeads.size === paginated.length) {
 setSelectedLeads(new Set())
 } else {
 setSelectedLeads(new Set(paginated.map(l => l.id)))
 }
 }

 const openEditDialog = (lead: Lead) => {
 setEditLead(lead)
 setEditIdentifier(lead.lead_identifier)
 setEditNotes(lead.notes || '')
 }

 const saveEdit = async () => {
 if (!editLead) return
 try {
 const res = await fetch(`/api/leads/${editLead.id}/status`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 notes: editNotes,
 ...(editIdentifier !== editLead.lead_identifier ? { lead_identifier: editIdentifier } : {})
 })
 })
 if (!res.ok) throw new Error('Failed to update')
 toast.success('Lead updated')
 setEditLead(null)
 fetchLeads()
 } catch (error) {
 toast.error('Failed to update lead')
 }
 }

 const confirmDelete = async (id: string) => {
 setLeadToDelete(id)
 setDeleteConfirm(true)
 }

 const deleteLead = async () => {
 if (!leadToDelete) return
 try {
 const res = await fetch(`/api/leads?id=${leadToDelete}`, {
 method: 'DELETE'
 })
 if (!res.ok) throw new Error('Failed to delete')
 toast.success('Lead deleted')
 setSelectedLeads(prev => {
 const next = new Set(prev)
 next.delete(leadToDelete)
 return next
 })
 fetchLeads()
 } catch (error) {
 toast.error('Failed to delete lead')
 } finally {
 setDeleteConfirm(false)
 setLeadToDelete(null)
 }
 }

 const bulkDelete = async () => {
 const ids = Array.from(selectedLeads)
 if (ids.length === 0) return
 try {
 for (const id of ids) {
 await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
 }
 toast.success(`${ids.length} leads deleted`)
 setSelectedLeads(new Set())
 fetchLeads()
 } catch (error) {
 toast.error('Failed to delete leads')
 }
 }

 useEffect(() => {
 fetchLeads()
 }, [])

 useEffect(() => {
 setPage(0)
 }, [search])

 const statusColor = (status: string) => {
 if (status === 'done') return 'bg-green-100 text-green-800'
 if (status === 'rejected') return 'bg-red-100 text-red-800'
 return 'bg-yellow-100 text-yellow-800'
 }

 return (
 <div className="max-w-7xl mx-auto space-y-6 pb-20">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Lead Pool</h1>
 <p className="text-muted-foreground mt-1">
 Manage unassigned leads in the pool. {totalCount} total unassigned leads.
 </p>
 </div>

 {/* Search and Actions */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="relative w-full sm:w-80">
 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search leads..."
 className="pl-8"
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={fetchLeads} disabled={loading}>
 <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
 Refresh
 </Button>
 {selectedLeads.size > 0 && (
 <Button variant="destructive" onClick={bulkDelete}>
 <Trash2 className="w-4 h-4 mr-2" />
 Delete {selectedLeads.size} Selected
 </Button>
 )}
 </div>
 </div>

 {/* Stats */}
 <div className="grid gap-4 md:grid-cols-4">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total in Pool</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{totalCount}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-yellow-600">
 {leads.filter(l => l.status === 'pending').length}
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Filtered</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{filtered.length}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Selected</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{selectedLeads.size}</div>
 </CardContent>
 </Card>
 </div>

 {/* Table */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Unassigned Leads</CardTitle>
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <span>Showing {paginated.length} of {filtered.length}</span>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="w-[40px]">
 <input
 type="checkbox"
 checked={paginated.length > 0 && selectedLeads.size === paginated.length}
 onChange={toggleSelectAll}
 className="w-4 h-4"
 />
 </TableHead>
 <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lead_identifier')}>
 <div className="flex items-center gap-1">
 Lead Identifier
 {sortField === 'lead_identifier' && (
 <ArrowUpDown className={cn('w-3 h-3', sortDir === 'desc' && 'rotate-180')} />
 )}
 </div>
 </TableHead>
 <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
 <div className="flex items-center gap-1">
 Status
 {sortField === 'status' && (
 <ArrowUpDown className={cn('w-3 h-3', sortDir === 'desc' && 'rotate-180')} />
 )}
 </div>
 </TableHead>
 <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
 <div className="flex items-center gap-1">
 Date Added
 {sortField === 'created_at' && (
 <ArrowUpDown className={cn('w-3 h-3', sortDir === 'desc' && 'rotate-180')} />
 )}
 </div>
 </TableHead>
 <TableHead>Notes</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-12">
 <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
 </TableCell>
 </TableRow>
 ) : paginated.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
 No unassigned leads found.
 </TableCell>
 </TableRow>
 ) : (
 paginated.map(lead => (
 <TableRow key={lead.id} className={selectedLeads.has(lead.id) ? 'bg-primary/5' : ''}>
 <TableCell>
 <input
 type="checkbox"
 checked={selectedLeads.has(lead.id)}
 onChange={() => toggleSelect(lead.id)}
 className="w-4 h-4"
 />
 </TableCell>
 <TableCell className="font-medium font-mono">{lead.lead_identifier}</TableCell>
 <TableCell>
 <Badge className={cn('capitalize', statusColor(lead.status))}>
 {lead.status}
 </Badge>
 </TableCell>
 <TableCell className="text-muted-foreground">
 {new Date(lead.created_at).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-muted-foreground max-w-[200px] truncate">
 {lead.notes || '-'}
 </TableCell>
 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-1">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => openEditDialog(lead)}
 title="Edit"
 >
 <Edit className="w-4 h-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => confirmDelete(lead.id)}
 title="Delete"
 className="text-red-500 hover:text-red-600 hover:bg-red-50"
 >
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between pt-4">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.max(0, p - 1))}
 disabled={page === 0}
 >
 <ChevronLeft className="w-4 h-4 mr-1" /> Previous
 </Button>
 <div className="text-sm text-muted-foreground">
 Page {page + 1} of {totalPages}
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
 disabled={page >= totalPages - 1}
 >
 Next <ChevronRight className="w-4 h-4 ml-1" />
 </Button>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Edit Dialog */}
 <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Edit Lead</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label>Lead Identifier</Label>
 <Input
 value={editIdentifier}
 onChange={e => setEditIdentifier(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label>Notes</Label>
 <Input
 value={editNotes}
 onChange={e => setEditNotes(e.target.value)}
 placeholder="Add notes..."
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setEditLead(null)}>Cancel</Button>
 <Button onClick={saveEdit}>Save Changes</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Delete Confirm Dialog */}
 <Dialog open={deleteConfirm} onOpenChange={() => setDeleteConfirm(false)}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Delete Lead</DialogTitle>
 </DialogHeader>
 <div className="py-4">
 <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
 <Button variant="destructive" onClick={deleteLead}>Delete</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
