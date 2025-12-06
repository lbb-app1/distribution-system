'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Check, X, Copy, RotateCcw, CheckCircle2, XCircle, StickyNote, Loader2, ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LeadCard } from '@/components/lead-card'
import { LeadRow } from '@/components/lead-row'

export default function UserDashboard() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [noteOpen, setNoteOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [noteText, setNoteText] = useState('')
    const [savingNote, setSavingNote] = useState(false)
    const [currentDate, setCurrentDate] = useState(new Date())

    const [search, setSearch] = useState('')

    const fetchLeads = async (date: Date) => {
        setLoading(true)
        try {
            const dateStr = date.toISOString().split('T')[0]
            let url = '/api/leads?date=' + dateStr
            if (search) {
                url = `/api/leads?search=${search}`
            }
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) {
                // If searching, we might get leads from other dates, so sorting by date might be better?
                // Or just keep alphabetical. Let's keep alphabetical for now.
                const sorted = data.sort((a: any, b: any) => a.lead_identifier.localeCompare(b.lead_identifier))
                setLeads(sorted)
            } else {
                setLeads([])
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to fetch leads')
            setLeads([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchLeads(currentDate)
        }, 300)
        return () => clearTimeout(timer)
    }, [currentDate, search])

    const handleDateChange = (days: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + days)
        setCurrentDate(newDate)
        setSearch('') // Clear search when changing date to avoid confusion? Or keep it? User said "search... may it be from any other day". So if search is active, date navigation might be confusing.
        // Let's clear search if user explicitly navigates dates.
    }

    const handleStatusUpdate = async (id: string, status: 'done' | 'rejected' | 'pending') => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))

        try {
            const res = await fetch(`/api/leads/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (!res.ok) throw new Error('Failed to update')
        } catch (error) {
            console.error('Failed to update status')
            toast.error('Failed to update status')
            fetchLeads(currentDate)
        }
    }

    const handleSubStatusUpdate = async (id: string, subStatus: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, sub_status: subStatus } : l))
        try {
            const res = await fetch(`/api/leads/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sub_status: subStatus })
            })
            if (!res.ok) throw new Error('Failed to update sub-status')
        } catch (error) {
            toast.error('Failed to update sub-status')
        }
    }

    const handleSaveNote = async () => {
        if (!selectedLead) return
        setSavingNote(true)
        try {
            // Optimistic update
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: noteText } : l))

            const res = await fetch(`/api/leads/${selectedLead.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: noteText }),
            })

            if (!res.ok) throw new Error('Failed to save note')

            toast.success('Note saved')
            setNoteOpen(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to save note. Ensure database schema is updated.')
            fetchLeads(currentDate)
        } finally {
            setSavingNote(false)
        }
    }

    const openNoteDialog = (lead: any) => {
        setSelectedLead(lead)
        setNoteText(lead.notes || '')
        setNoteOpen(true)
    }

    const isToday = currentDate.toDateString() === new Date().toDateString()

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)} disabled={!!search}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center min-w-[200px] flex-1 md:flex-none">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                            {search ? "Search Results" : (isToday ? "Today" : currentDate.toLocaleDateString(undefined, { weekday: 'long' }))}
                        </div>
                        {!search && (
                            <div className="text-lg font-bold flex items-center justify-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                {currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDateChange(1)}
                        disabled={isToday || !!search}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="text-sm font-medium bg-secondary/50 px-4 py-2 rounded-full border whitespace-nowrap">
                        {leads.filter(l => l.status === 'done').length} / {leads.length} Done
                    </div>
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-4 sm:hidden">
                {leads.map(lead => (
                    <LeadCard
                        key={lead.id}
                        lead={lead}
                        onStatusUpdate={handleStatusUpdate}
                        onSubStatusUpdate={handleSubStatusUpdate}
                        onOpenNote={openNoteDialog}
                    />
                ))}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden sm:block border rounded-lg bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead className="w-[350px]">Lead Identifier</TableHead>
                            <TableHead className="w-[150px] text-center">Status</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right w-[200px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map(lead => (
                            <LeadRow
                                key={lead.id}
                                lead={lead}
                                onStatusUpdate={handleStatusUpdate}
                                onSubStatusUpdate={handleSubStatusUpdate}
                                onOpenNote={openNoteDialog}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {leads.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    {search ? "No leads found matching your search." : `No leads assigned for ${currentDate.toLocaleDateString()}.`}
                </div>
            )}

            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lead Notes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Note for {selectedLead?.lead_identifier}</Label>
                            <Textarea
                                placeholder="Enter notes here..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveNote} disabled={savingNote}>
                            {savingNote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
