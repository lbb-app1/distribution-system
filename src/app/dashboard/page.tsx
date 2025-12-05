'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Check, X, Copy, RotateCcw, CheckCircle2, XCircle, StickyNote, Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export default function UserDashboard() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [noteOpen, setNoteOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [noteText, setNoteText] = useState('')
    const [savingNote, setSavingNote] = useState(false)
    const [currentDate, setCurrentDate] = useState(new Date())

    const fetchLeads = async (date: Date) => {
        setLoading(true)
        try {
            const dateStr = date.toISOString().split('T')[0]
            const res = await fetch('/api/leads?date=' + dateStr)
            const data = await res.json()
            if (Array.isArray(data)) {
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
        fetchLeads(currentDate)
    }, [currentDate])

    const handleDateChange = (days: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + days)
        setCurrentDate(newDate)
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    const isToday = currentDate.toDateString() === new Date().toDateString()

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center min-w-[200px]">
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                            {isToday ? "Today" : currentDate.toLocaleDateString(undefined, { weekday: 'long' })}
                        </div>
                        <div className="text-lg font-bold flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDateChange(1)}
                        disabled={isToday} // Optional: disable future dates if desired, but user might want to see assignments
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-sm font-medium bg-secondary/50 px-4 py-2 rounded-full border">
                    {leads.filter(l => l.status === 'done').length} / {leads.length} Completed
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-4 sm:hidden">
                {leads.map(lead => (
                    <Card key={lead.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/20">
                            <div className="flex justify-between items-start">
                                <div className="font-mono font-medium text-lg break-all mr-2">
                                    {lead.lead_identifier}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => copyToClipboard(lead.lead_identifier)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 pb-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <div className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                    lead.status === 'done' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900",
                                    lead.status === 'rejected' && "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900",
                                    lead.status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900"
                                )}>
                                    <span className="capitalize">{lead.status}</span>
                                </div>
                            </div>
                            {lead.notes && (
                                <div className="bg-muted p-3 rounded-md text-sm italic">
                                    "{lead.notes}"
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/10 pt-2 flex justify-between gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => openNoteDialog(lead)}
                            >
                                <StickyNote className="w-4 h-4 mr-2" />
                                {lead.notes ? 'Edit Note' : 'Add Note'}
                            </Button>

                            {lead.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleStatusUpdate(lead.id, 'done')}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleStatusUpdate(lead.id, 'rejected')}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusUpdate(lead.id, 'pending')}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
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
                            <TableRow key={lead.id} className="group hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium font-mono text-sm">
                                    <div className="flex items-center space-x-3">
                                        <span>{lead.lead_identifier}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-50 hover:opacity-100 transition-opacity"
                                            onClick={() => copyToClipboard(lead.lead_identifier)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                        lead.status === 'done' && "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900",
                                        lead.status === 'rejected' && "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900",
                                        lead.status === 'pending' && "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900"
                                    )}>
                                        {lead.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                        {lead.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                        <span className="capitalize">{lead.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        {lead.notes && (
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {lead.notes}
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-muted-foreground"
                                            onClick={() => openNoteDialog(lead)}
                                        >
                                            <StickyNote className="w-3 h-3 mr-1" />
                                            {lead.notes ? 'Edit' : 'Add'}
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        {lead.status === 'pending' ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-900/20"
                                                    onClick={() => handleStatusUpdate(lead.id, 'done')}
                                                    title="Mark as Done"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20"
                                                    onClick={() => handleStatusUpdate(lead.id, 'rejected')}
                                                    title="Mark as Rejected"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleStatusUpdate(lead.id, 'pending')}
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                Re-evaluate
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {leads.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    No leads assigned for {currentDate.toLocaleDateString()}.
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
