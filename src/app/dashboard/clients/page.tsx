'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, Calendar, Save, StickyNote, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ClientListPage() {
    const [clients, setClients] = useState<any[]>([])
    const [filteredClients, setFilteredClients] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [showActive, setShowActive] = useState(true)
    const [loading, setLoading] = useState(true)

    // Note state
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [newNote, setNewNote] = useState('')
    const [noteDialogOpen, setNoteDialogOpen] = useState(false)

    // Add Client state
    const [addClientOpen, setAddClientOpen] = useState(false)
    const [newClientName, setNewClientName] = useState('')
    const [newClientNote, setNewClientNote] = useState('')

    useEffect(() => {
        fetchClients()
    }, [])

    const handleAddClient = async () => {
        if (!newClientName.trim()) return

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_identifier: newClientName,
                    notes: newClientNote,
                    status: 'done',
                    sub_status: 'Closed'
                })
            })

            if (!res.ok) throw new Error('Failed to add client')

            toast.success('Client added successfully')
            setAddClientOpen(false)
            setNewClientName('')
            setNewClientNote('')
            fetchClients()
        } catch (error) {
            toast.error('Failed to add client')
        }
    }

    useEffect(() => {
        filterClients()
    }, [clients, search, showActive])

    const fetchClients = async () => {
        try {
            // We want closed clients. 'Closed' is a sub_status.
            const res = await fetch('/api/leads?sub_status=Closed')
            const data = await res.json()
            if (Array.isArray(data)) {
                // Enrich with notes if needed, or fetch separately.
                // For now, let's assume we fetch extra notes on demand or they are embedded if we join.
                // We'll fetch extra notes when opening the dialog.
                setClients(data)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to fetch clients')
        } finally {
            setLoading(false)
        }
    }

    const filterClients = () => {
        let res = clients

        // Active vs Inactive logic
        // "Segregated automatically". 
        // What defines active? Maybe a manual toggle on the client list row?
        // Or "Closed" means they are a client. 
        // User said: "switch button of active or inactive".
        // This implies a new field on the lead or a new table 'clients' that tracks this state?
        // Let's assume we toggle a field. If it doesn't exist, we might need to add it or use a convention.
        // Let's use a local state or a "client_status" field.
        // For MVP, lets assume all "Closed" leads are "Active Clients" initially unless marked otherwise.
        // We might need to add `client_status` to schema.
        // Let's add a `is_active_client` boolean to leads table via API?
        // Or filter by something else.
        // Let's filter by `client_active` property which we need to mock or add.

        if (search) {
            res = res.filter(c =>
                c.lead_identifier.toLowerCase().includes(search.toLowerCase()) ||
                (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()))
            )
        }

        // Filter based on the Switch
        // We will match the boolean `is_active_client` which defaults to true for closed deals if null?
        res = res.filter(c => {
            const isActive = c.is_active_client !== false // Default true
            return showActive ? isActive : !isActive
        })

        setFilteredClients(res)
    }

    const toggleClientStatus = async (client: any) => {
        const newStatus = !(client.is_active_client !== false) // Toggle

        // Optimistic update
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active_client: newStatus } : c))

        try {
            await fetch(`/api/leads/${client.id}/client-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active_client: newStatus })
            })
            toast.success(newStatus ? 'Client marked as Active' : 'Client marked as Inactive')
        } catch (error) {
            toast.error('Failed to update status')
            fetchClients()
        }
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !selectedClient) return

        try {
            const res = await fetch(`/api/leads/${selectedClient.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: newNote })
            })

            if (res.ok) {
                const note = await res.json()
                // Update local state if we want real-time feel
                // For now, reload notes
                loadClientNotes(selectedClient.id)
                setNewNote('')
                toast.success('Note added')
            }
        } catch (error) {
            toast.error('Failed to add note')
        }
    }

    const [clientNotes, setClientNotes] = useState<any[]>([])
    const loadClientNotes = async (id: string) => {
        const res = await fetch(`/api/leads/${id}/notes`)
        const data = await res.json()
        if (Array.isArray(data)) setClientNotes(data)
    }

    const openNoteModal = (client: any) => {
        setSelectedClient(client)
        setClientNotes([]) // clear prev
        loadClientNotes(client.id)
        setNoteDialogOpen(true)
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">Client List</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button onClick={() => setAddClientOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Manually
                    </Button>
                    <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
                        <Label htmlFor="active-mode" className="text-sm font-medium cursor-pointer">Inactive</Label>
                        <Switch id="active-mode" checked={showActive} onCheckedChange={setShowActive} />
                        <Label htmlFor="active-mode" className="text-sm font-medium cursor-pointer">Active</Label>
                    </div>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search clients..."
                    className="pl-10 h-10"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map(client => (
                    <Card key={client.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary/50">
                        <CardHeader className="bg-muted/10 pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold truncate">{client.lead_identifier}</CardTitle>
                                <Switch
                                    checked={client.is_active_client !== false}
                                    onCheckedChange={() => toggleClientStatus(client)}
                                    className="scale-75"
                                />
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                Closed on {client.assigned_date ? format(new Date(client.assigned_date), 'PPP') : 'N/A'}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {client.notes && (
                                <div className="text-sm text-muted-foreground italic line-clamp-2 mb-4">
                                    "{client.notes}"
                                </div>
                            )}
                            <Button variant="outline" size="sm" className="w-full" onClick={() => openNoteModal(client)}>
                                <StickyNote className="w-3 h-3 mr-2" />
                                Manage Notes
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {filteredClients.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No {showActive ? 'active' : 'inactive'} clients found.
                    </div>
                )}
            </div>

            <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Client Name / Business Name</Label>
                            <Input
                                placeholder="e.g. Acme Corp"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Initial Note (Optional)</Label>
                            <Textarea
                                placeholder="Any starter details..."
                                value={newClientNote}
                                onChange={(e) => setNewClientNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddClientOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddClient} disabled={!newClientName.trim()}>Add Client</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Notes for {selectedClient?.lead_identifier}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a new note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                            />
                            <Button size="icon" onClick={handleAddNote}>
                                <Save className="w-4 h-4" />
                            </Button>
                        </div>
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {clientNotes.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8">No extra notes yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {clientNotes.map(note => (
                                        <div key={note.id} className="bg-muted/50 p-3 rounded-lg text-sm">
                                            <p>{note.note}</p>
                                            <div className="text-xs text-muted-foreground mt-2 text-right">
                                                {format(new Date(note.created_at), 'PP p')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
