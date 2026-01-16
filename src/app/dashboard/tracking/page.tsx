'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, MessageCircle, Eye, CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { LeadCard } from '@/components/lead-card'
import { LeadRow } from '@/components/lead-row'
import { Table, TableBody } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TrackingPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [view, setView] = useState('kanban')
    const [noteOpen, setNoteOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [noteText, setNoteText] = useState('')
    const [savingNote, setSavingNote] = useState(false)

    useEffect(() => {
        fetchLeads()
    }, [search])

    const fetchLeads = async () => {
        let url = `/api/leads?sub_status=tracking`
        if (search) {
            url += `&search=${search}`
        }
        const res = await fetch(url)
        const data = await res.json()
        if (Array.isArray(data)) {
            setLeads(data)
        }
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
            fetchLeads()
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
            fetchLeads()
        } finally {
            setSavingNote(false)
        }
    }

    const openNoteDialog = (lead: any) => {
        setSelectedLead(lead)
        setNoteText(lead.notes || '')
        setNoteOpen(true)
    }

    const columns = [
        { id: 'Replied', label: 'Replied', color: 'bg-yellow-100 dark:bg-yellow-900/20', icon: MessageCircle, badge: 'yellow' },
        { id: 'Seen', label: 'Seen', color: 'bg-orange-100 dark:bg-orange-900/20', icon: Eye, badge: 'orange' },
        { id: 'Booked', label: 'Booked', color: 'bg-blue-100 dark:bg-blue-900/20', icon: CalendarCheck, badge: 'blue' },
        { id: 'Closed', label: 'Closed', color: 'bg-green-100 dark:bg-green-900/20', icon: CheckCircle2, badge: 'green' },
    ]

    const KanbanColumn = ({ column }: { column: any }) => {
        const columnLeads = leads.filter(l => l.sub_status === column.id)
        return (
            <div className={`flex-1 min-w-[300px] rounded-lg border p-4 ${column.color}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center">
                        <column.icon className="w-4 h-4 mr-2" />
                        {column.label}
                    </h3>
                    <Badge variant="secondary">{columnLeads.length}</Badge>
                </div>
                <div className="space-y-3">
                    {columnLeads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onStatusUpdate={handleStatusUpdate}
                            onSubStatusUpdate={handleSubStatusUpdate}
                            onOpenNote={openNoteDialog}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Tracking Board</h1>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search history..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Tabs value={view} onValueChange={setView} className="w-[180px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="kanban">Kanban</TabsTrigger>
                            <TabsTrigger value="list">List</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {view === 'kanban' ? (
                <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
                    {columns.map(col => (
                        <KanbanColumn key={col.id} column={col} />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {columns.map(col => {
                        const columnLeads = leads.filter(l => l.sub_status === col.id)
                        if (columnLeads.length === 0) return null
                        return (
                            <Card key={col.id}>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-base flex items-center">
                                        <col.icon className="w-4 h-4 mr-2" />
                                        {col.label} ({columnLeads.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                    <div className="space-y-2">
                                        {columnLeads.map(lead => (
                                            <div key={lead.id} className="p-2 border rounded-md bg-muted/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium">{lead.lead_identifier}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(lead.assigned_date || lead.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {/* We can reuse LeadRow here but it's designed for TableRow. 
                                                    Since we are inside a Card, maybe just use LeadCard? 
                                                    Or a simplified row. The user asked for "all other buttons should be visible".
                                                    So let's use LeadCard even in List view for full functionality, or wrap LeadRow in a Table.
                                                */}
                                                {/* Let's wrap in a Table for the list view to use LeadRow properly */}
                                                <div className="border rounded-md bg-background">
                                                    <Table>
                                                        <TableBody>
                                                            <LeadRow
                                                                lead={lead}
                                                                index={0} // Index not relevant in this specific grouped tracking view, but required by type
                                                                onStatusUpdate={handleStatusUpdate}
                                                                onSubStatusUpdate={handleSubStatusUpdate}
                                                                onOpenNote={openNoteDialog}
                                                            />
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
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
