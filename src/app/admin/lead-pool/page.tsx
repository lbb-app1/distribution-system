'use client'
import { useEffect, useState } from 'react'
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
 Zap,
 UserX,
 CheckCheck,
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

interface Pool {
 id: string
 display_name: string
 lead_count: number
 assigned_count: number
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
 const [totalPages, setTotalPages] = useState(0)
 const [hasPrev, setHasPrev] = useState(false)
 const [hasNext, setHasNext] = useState(false)

 // Bulk operation state
 const [bulkOpen, setBulkOpen] = useState(false)
 const [bulkAction, setBulkAction] = useState<'delete' | 'unassign' | 'mark_done' | 'mark_pending'>('delete')
 const [bulkCount, setBulkCount] = useState<number>(100)
 const [bulkBusy, setBulkBusy] = useState(false)

 const fetchLeads = async () => {
 setLoading(true)
 try {
 const queryParams = new URLSearchParams({
 unassigned: 'true',
 page: page.toString(),
 limit: ITEMS_PER_PAGE.toString(),
 sort_by: sortField,
 sort_order: sortDir,
 })

 if (search) {
 queryParams.append('search', search)
 }

 const res = await fetch(`/api/leads?${queryParams}`)
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)

 setLeads(data.data || [])
 setTotalCount(data.count || 0)
 setTotalPages(data.pagination?.totalPages || 0)
 setHasPrev(data.pagination?.hasPrev || false)
 setHasNext(data.pagination?.hasNext || false)
 } catch (error) {
 console.error('Failed to fetch leads:', error)
 toast.error('Failed to load lead pool')
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 fetchLeads()
 }, [page, sortField, sortDir, search])

 const handleSort = (field: SortField) => {
 if (sortField === field) {
 setSortDir(d => d === 'asc' ? 'desc' : 'asc')
 } else {
 setSortField(field)
 setSortDir('asc')
 setPage(0)
 }
 }

 const toggleSelect = (id: string) => {
 const next = new Set(selectedLeads)
 if (next.has(id)) next.delete(id)
 else next.add(id)
 setSelectedLeads(next)
 }

 const toggleSelectAll = () => {
 if (selectedLeads.size === leads.length) {
 setSelectedLeads(new Set())
 } else {
 setSelectedLeads(new Set(leads.map(l => l.id)))
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

 const confirmDelete = (id: string) => {
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
 // Send single batch instead of N requests
 const res = await fetch('/api/leads', {
 method: 'DELETE',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ids })
 })
 if (!res.ok) throw new Error('Failed to delete')
 const data = await res.json()
 toast.success(`${data.count || ids.length} leads deleted`)
 setSelectedLeads(new Set())
 fetchLeads()
 } catch (error) {
 toast.error('Failed to delete leads')
 }
 }

 const runBulkAction = async () => {
 if (bulkCount <= 0) {
 toast.error('Count must be greater than 0')
 return
 }
 setBulkBusy(true)
 try {
 const action = bulkAction === 'mark_done' ? 'status' : bulkAction === 'mark_pending' ? 'status' : bulkAction
 const payload: any = {
 action,
 count: bulkCount,
 }
 if (bulkAction === 'mark_done') payload.status = 'done'
 if (bulkAction === 'mark_pending') payload.status = 'pending'

 const res = await fetch('/api/lead-pool/bulk', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 })
 if (!res.ok) throw new Error('Failed to run bulk action')
 const data = await res.json()
 toast.success(`Bulk ${bulkAction} complete: ${data.affected} leads affected`)
 setBulkOpen(false)
 fetchLeads()
 } catch (error) {
 toast.error('Failed to run bulk action')
 } finally {
 setBulkBusy(false)
 }
 }

 const bulkActionLabels: Record<typeof bulkAction, string> = {
 delete: 'Delete N unassigned leads',
 unassign: 'Unassign N leads (set assigned_to=null)',
 mark_done: 'Mark N leads as done',
 mark_pending: 'Mark N leads as pending',
 }

 return (
 <div className="container mx-auto py-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Database className="w-5 h-5" />
 Lead Pool
 <span className="text-sm text-muted-foreground font-normal">
 ({totalCount} unassigned leads)
 </span>
 <Button
 variant="outline"
 size="sm"
 onClick={fetchLeads}
 disabled={loading}
 className="ml-auto"
 >
 <RefreshCw className="w-4 h-4" />
 </Button>
 </CardTitle>
 <div className="text-sm text-muted-foreground mt-1">
 Showing page {page + 1} of {totalPages}
 </div>
 <div className="flex items-center gap-4 flex-wrap">
 <div className="flex-1 min-w-[200px]">
 <Input
 placeholder="Search leads..."
 value={search}
 onChange={e => {
 setSearch(e.target.value)
 setPage(0)
 }}
 className="max-w-sm"
 />
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm text-muted-foreground">Sort:</span>
 <Button
 variant={sortField === 'lead_identifier' ? 'default' : 'outline'}
 size="sm"
 onClick={() => handleSort('lead_identifier')}
 >
 Name <ArrowUpDown className="w-3 h-3 ml-1" />
 </Button>
 <Button
 variant={sortField === 'status' ? 'default' : 'outline'}
 size="sm"
 onClick={() => handleSort('status')}
 >
 Status <ArrowUpDown className="w-3 h-3 ml-1" />
 </Button>
 <Button
 variant={sortField === 'created_at' ? 'default' : 'outline'}
 size="sm"
 onClick={() => handleSort('created_at')}
 >
 Date <ArrowUpDown className="w-3 h-3 ml-1" />
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => setBulkOpen(true)}
 >
 <Zap className="w-4 h-4 mr-1" />
 Bulk Ops
 </Button>
 {selectedLeads.size > 0 && (
 <>
 <Badge variant="secondary">{selectedLeads.size} selected</Badge>
 <Button
 variant="destructive"
 size="sm"
 onClick={bulkDelete}
 >
 <Trash2 className="w-4 h-4 mr-1" />
 Delete ({selectedLeads.size})
 </Button>
 </>
 )}
 </div>
 </div>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="text-center py-8">Loading leads...</div>
 ) : (
 <>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="w-12">
 <input
 type="checkbox"
 checked={selectedLeads.size === leads.length && leads.length > 0}
 onChange={toggleSelectAll}
 className="rounded border-gray-300"
 />
 </TableHead>
 <TableHead className="cursor-pointer select-none" onClick={() => handleSort('lead_identifier')}>
 Lead Identifier <ArrowUpDown className="w-3 h-3 inline ml-1" />
 </TableHead>
 <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
 Status <ArrowUpDown className="w-3 h-3 inline ml-1" />
 </TableHead>
 <TableHead className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
 Created Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
 </TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {leads.map(lead => (
 <TableRow key={lead.id}>
 <TableCell>
 <input
 type="checkbox"
 checked={selectedLeads.has(lead.id)}
 onChange={() => toggleSelect(lead.id)}
 className="rounded border-gray-300"
 />
 </TableCell>
 <TableCell>{lead.lead_identifier}</TableCell>
 <TableCell>
 <Badge
 variant={lead.status === 'done' ? 'default' : 'secondary'}
 className={cn(
 lead.status === 'done' && 'bg-green-100 text-green-800',
 lead.status === 'pending' && 'bg-yellow-100 text-yellow-800',
 )}
 >
 {lead.status}
 </Badge>
 </TableCell>
 <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => openEditDialog(lead)}
 >
 <Edit className="w-4 h-4" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => confirmDelete(lead.id)}
 >
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </>
 )}

 <div className="flex items-center justify-between mt-4">
 <div className="text-sm text-muted-foreground">
 Showing {(page * ITEMS_PER_PAGE) + 1} to {Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount} leads
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(0)}
 disabled={!hasPrev}
 >
 <ChevronLeft className="w-4 h-4" />
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.max(0, p - 1))}
 disabled={!hasPrev}
 >
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <span className="text-sm">
 Page {page + 1} of {totalPages}
 </span>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
 disabled={!hasNext}
 >
 <ChevronRight className="w-4 h-4" />
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(totalPages - 1)}
 disabled={!hasNext}
 >
 <ChevronRight className="w-4 h-4" />
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Edit Dialog */}
 <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Edit Lead</DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <div className="grid gap-2">
 <Label htmlFor="identifier">Lead Identifier</Label>
 <Input
 id="identifier"
 value={editIdentifier}
 onChange={e => setEditIdentifier(e.target.value)}
 />
 </div>
 <div className="grid gap-2">
 <Label htmlFor="notes">Notes</Label>
 <Input
 id="notes"
 value={editNotes}
 onChange={e => setEditNotes(e.target.value)}
 />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setEditLead(null)}>Cancel</Button>
 <Button onClick={saveEdit}>Save Changes</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Delete Confirmation Dialog */}
 <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Confirm Delete</DialogTitle>
 </DialogHeader>
 <p>
 Are you sure you want to delete this lead? This action cannot be undone.
 </p>
 <DialogFooter>
 <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
 <Button variant="destructive" onClick={deleteLead}>Delete</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Bulk Operations Dialog */}
 <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Zap className="w-5 h-5" />
 Bulk Operations
 </DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <p className="text-sm text-muted-foreground">
 Perform operations on N leads without selecting them. Targets unassigned leads by default.
 </p>
 <div className="grid gap-2">
 <Label>Action</Label>
 <div className="grid grid-cols-2 gap-2">
 <Button
 variant={bulkAction === 'delete' ? 'default' : 'outline'}
 onClick={() => setBulkAction('delete')}
 >
 <Trash2 className="w-4 h-4 mr-1" /> Delete
 </Button>
 <Button
 variant={bulkAction === 'unassign' ? 'default' : 'outline'}
 onClick={() => setBulkAction('unassign')}
 >
 <UserX className="w-4 h-4 mr-1" /> Unassign
 </Button>
 <Button
 variant={bulkAction === 'mark_done' ? 'default' : 'outline'}
 onClick={() => setBulkAction('mark_done')}
 >
 <CheckCheck className="w-4 h-4 mr-1" /> Mark done
 </Button>
 <Button
 variant={bulkAction === 'mark_pending' ? 'default' : 'outline'}
 onClick={() => setBulkAction('mark_pending')}
 >
 Mark pending
 </Button>
 </div>
 </div>
 <div className="grid gap-2">
 <Label htmlFor="count">How many leads to affect</Label>
 <Input
 id="count"
 type="number"
 min="1"
 max="2000"
 value={bulkCount}
 onChange={e => setBulkCount(parseInt(e.target.value) || 0)}
 />
 <p className="text-xs text-muted-foreground">
 Max 2,000 per operation. {totalCount.toLocaleString()} unassigned leads available.
 </p>
 </div>
 <div className="text-sm font-medium p-3 bg-muted rounded">
 {bulkActionLabels[bulkAction]} ({bulkCount})
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkBusy}>Cancel</Button>
 <Button onClick={runBulkAction} disabled={bulkBusy}>
 {bulkBusy ? 'Working...' : `Run on ${bulkCount} leads`}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
