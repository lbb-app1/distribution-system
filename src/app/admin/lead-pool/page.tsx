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
 const [totalPages, setTotalPages] = useState(0)
 const [hasPrev, setHasPrev] = useState(false)
 const [hasNext, setHasNext] = useState(false)

 const fetchLeads = async () => {
 setLoading(true)
 try {
 // Build query with all parameters for server-side filtering/sorting
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

 // Initial fetch and whenever filters change
 useEffect(() => {
 fetchLeads()
 }, [page, sortField, sortDir, search])

 const handleSort = (field: SortField) => {
 if (sortField === field) {
 setSortDir(d => d === 'asc' ? 'desc' : 'asc')
 } else {
 setSortField(field)
 setSortDir('asc')
 setPage(0) // Reset to first page when changing sort
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

 return (
 <div className="container mx-auto py-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Database className="w-5 h-5" />
 Lead Pool
 <span className="text-sm text-muted-foreground font-normal">
 ({totalCount} leads)
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
 <div className="flex items-center gap-4">
 <div className="flex-1">
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
 <div className="flex items-center gap-2">
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
 {selectedLeads.size > 0 && (
 <Button
 variant="destructive"
 size="sm"
 onClick={bulkDelete}
 >
 <Trash2 className="w-4 h-4 mr-1" />
 Delete ({selectedLeads.size})
 </Button>
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

 {/* Pagination */}
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
 </div>
 )
}