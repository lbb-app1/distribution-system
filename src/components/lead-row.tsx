import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Check, X, Copy, RotateCcw, StickyNote, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LeadRowProps {
    lead: any
    onStatusUpdate: (id: string, status: 'done' | 'rejected' | 'pending') => void
    onSubStatusUpdate: (id: string, subStatus: string) => void
    onOpenNote: (lead: any) => void
}

export function LeadRow({ lead, onStatusUpdate, onSubStatusUpdate, onOpenNote }: LeadRowProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <TableRow className="group hover:bg-muted/50 transition-colors">
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
                <div className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.assigned_date || lead.created_at).toLocaleDateString()}
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
                        onClick={() => onOpenNote(lead)}
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
                                onClick={() => onStatusUpdate(lead.id, 'done')}
                                title="Mark as Done"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20"
                                onClick={() => onStatusUpdate(lead.id, 'rejected')}
                                title="Mark as Rejected"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            {lead.status === 'done' && (
                                <select
                                    className="h-8 text-xs border rounded bg-background px-2 w-24"
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
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => onStatusUpdate(lead.id, 'pending')}
                            >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Re-evaluate
                            </Button>
                        </div>
                    )}
                </div>
            </TableCell>
        </TableRow>
    )
}
