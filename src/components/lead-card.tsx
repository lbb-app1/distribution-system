import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Check, X, Copy, RotateCcw, StickyNote, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LeadCardProps {
    lead: any
    onStatusUpdate: (id: string, status: 'done' | 'rejected' | 'pending') => void
    onSubStatusUpdate: (id: string, subStatus: string) => void
    onOpenNote: (lead: any) => void
}

export function LeadCard({ lead, onStatusUpdate, onSubStatusUpdate, onOpenNote }: LeadCardProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <Card className="overflow-hidden">
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
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assigned</span>
                    <span className="text-xs">{new Date(lead.assigned_date || lead.created_at).toLocaleDateString()}</span>
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
                    onClick={() => onOpenNote(lead)}
                >
                    <StickyNote className="w-4 h-4 mr-2" />
                    {lead.notes ? 'Edit Note' : 'Add Note'}
                </Button>

                {lead.status === 'pending' ? (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onStatusUpdate(lead.id, 'done')}
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onStatusUpdate(lead.id, 'rejected')}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {lead.status === 'done' && (
                            <select
                                className="h-8 text-xs border rounded bg-background px-2 max-w-[100px]"
                                value={lead.sub_status || ''}
                                onChange={(e) => onSubStatusUpdate(lead.id, e.target.value)}
                            >
                                <option value="" disabled>Status</option>
                                <option value="Replied">Replied</option>
                                <option value="Seen">Seen</option>
                                <option value="Booked">Booked</option>
                                <option value="Closed">Closed</option>
                            </select>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusUpdate(lead.id, 'pending')}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
