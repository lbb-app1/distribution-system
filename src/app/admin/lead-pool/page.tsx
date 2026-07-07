'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
 Database,
 Upload,
 Download,
 Users,
 FileText,
 RefreshCw,
 Search,
 Calendar,
 Trash2,
 RotateCcw,
 ArrowRight,
 Users as UsersIcon,
 Trophy,
 Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface LeadUpload {
 id: string
 display_name: string
 file_name: string
 uploaded_by: string
 uploaded_at: string
 lead_count: number
 assigned_count: number
 pending_count: number
 done_count: number
 rejected_count: number
 is_active: boolean
 upload_percentage: number
}

interface BulkOperation {
 id: string
 operation_type: string
 performed_by: string
 performed_at: string
 notes: string
}

export default function LeadPoolPage() {
 const [uploads, setUploads] = useState<LeadUpload[]>([])
 const [analytics, setAnalytics] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedUpload, setSelectedUpload] = useState<LeadUpload | null>(null)
 const [actionDialog, setActionDialog] = useState<'withdraw' | 'reassign'>()
 const [leadsCount, setLeadsCount] = useState<number>(10)
 const [operations, setOperations] = useState<BulkOperation[]>([])
 const [activeTab, setActiveTab] = useState('overview')

 const fetchUploads = async () => {
 try {
 const res = await fetch('/api/lead-pool/uploads?active=true')
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setUploads(data || [])
 } catch (error) {
 console.error('Failed to fetch uploads:', error)
 toast.error('Failed to load lead pools')
 } finally {
 setLoading(false)
 }
 }

 const fetchAnalytics = async () => {
 try {
 const res = await fetch('/api/lead-pool/analytics?period=30days')
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setAnalytics(data)
 } catch (error) {
 console.error('Failed to fetch analytics:', error)
 }
 }

 const fetchOperations = async () => {
 try {
 const res = await fetch('/api/admin/tracking')
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setOperations(data || [])
 } catch (error) {
 console.error('Failed to fetch operations:', error)
 }
 }

 const handleWithdraw = async () => {
 if (!selectedUpload || !actionDialog) return

 try {
 const res = await fetch('/api/lead-pool/withdraw', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 upload_id: selectedUpload.id,
 withdraw_all: true,
 reason: `Bulk withdrawal by admin`,
 })
 })

 if (!res.ok) throw new Error('Failed to withdraw leads')

 await fetchUploads()
 await fetchAnalytics()
 fetchOperations()
 setActionDialog(undefined)
 toast.success('Leads withdrawn successfully!')
 } catch (error) {
 console.error('Withdraw error:', error)
 toast.error('Failed to withdraw leads')
 }
 }

 const handleReassign = async () => {
 if (!selectedUpload || !actionDialog || !leadsCount) return

 try {
 const res = await fetch('/api/lead-pool/reassign', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 upload_id: selectedUpload.id,
 count: leadsCount,
 reason: `Reassign ${leadsCount} leads from ${selectedUpload.display_name}`,
 })
 })

 if (!res.ok) throw new Error('Failed to reassign leads')

 await fetchUploads()
 await fetchAnalytics()
 fetchOperations()
 setActionDialog(undefined)
 setLeadsCount(10)
 toast.success('Leads reassigned successfully!')
 } catch (error) {
 console.error('Reassign error:', error)
 toast.error('Failed to reassign leads')
 }
 }

 const getUploadStats = (upload: LeadUpload) => {
 if (upload.done_count > 0) {
 return {
 percentage: Math.round((upload.done_count / upload.lead_count) * 100),
 color: 'green'
 }
 } else if (upload.rejected_count > 0) {
 return {
 percentage: Math.round((upload.rejected_count / upload.lead_count) * 100),
 color: 'red'
 }
 } else {
 return {
 percentage: Math.round((upload.assigned_count / upload.lead_count) * 100),
 color: 'yellow'
 }
 }
 }

 useEffect(() => {
 if (activeTab === 'overview') {
 fetchUploads()
 }
 if (activeTab === 'analytics') {
 fetchAnalytics()
 }
 if (activeTab === 'operations') {
 fetchOperations()
 }
 }, [activeTab])

 const filteredUploads = uploads.filter(upload =>
 upload.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 upload.file_name.toLowerCase().includes(searchTerm.toLowerCase())
 )

 return (
 <div className="max-w-7xl mx-auto space-y-6 pb-20">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Lead Pool Management</h1>
 <p className="text-muted-foreground mt-1">
 Monitor and manage all bulk uploaded leads by source.
 </p>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="analytics">Analytics</TabsTrigger>
 <TabsTrigger value="operations">Recent Operations</TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="space-y-6">
 {/* Search and Actions */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="relative w-full sm:w-96">
 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search lead pools..."
 className="pl-8"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={fetchUploads}>
 <RefreshCw className="w-4 h-4 mr-2" />
 Refresh
 </Button>
 </div>
 </div>

 {/* Uploads Grid */}
 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
 {filteredUploads.map((upload) => {
 const stats = getUploadStats(upload)
 return (
 <Card key={upload.id} className="relative">
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg">{upload.display_name}</CardTitle>
 <Badge variant={upload.is_active ? 'default' : 'secondary'}>
 {upload.is_active ? 'Active' : 'Archived'}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">{upload.file_name}</p>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="text-center py-2">
 <div className="text-3xl font-bold">{upload.lead_count}</div>
 <div className="text-sm text-muted-foreground">Total Leads</div>
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Assigned</span>
 <span>{upload.assigned_count} ({upload.upload_percentage}%)</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Completed</span>
 <span className="text-green-600">{upload.done_count}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Pending</span>
 <span className="text-yellow-600">{upload.pending_count}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted-foreground">Rejected</span>
 <span className="text-red-600">{upload.rejected_count}</span>
 </div>
 </div>

 <div className="pt-2">
 <div className="text-xs text-muted-foreground mb-1">
 Performance: {stats.percentage}%
 </div>
 <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
 <div
 className={`h-full rounded-full ${
 stats.color === 'green' ? 'bg-green-500' :
 stats.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'
 }`}
 style={{ width: `${stats.percentage}%` }}
 />
 </div>
 </div>

 <div className="pt-2 text-xs text-muted-foreground">
 Uploaded by {upload.uploaded_by}
 <br />
 {new Date(upload.uploaded_at).toLocaleDateString()}
 </div>

 <div className="flex gap-2 pt-2">
 <Dialog open={selectedUpload?.id === upload.id && !!actionDialog} onOpenChange={() => setActionDialog(actionDialog ? undefined : 'withdraw')}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm" onClick={() => setSelectedUpload(upload)}>
 <Trash2 className="w-4 h-4 mr-1" />
 Withdraw
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Withdraw Leads</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <p>
 This will withdraw all leads from <strong>{upload.display_name}</strong> and mark them as rejected.
 </p>
 <div className="flex gap-2">
 <Button variant="outline" onClick={() => setActionDialog(undefined)}>
 Cancel
 </Button>
 <Button variant="destructive" onClick={handleWithdraw}>
 Withdraw All
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 <Button variant="outline" size="sm" onClick={() => setSelectedUpload(upload)}>
 <RotateCcw className="w-4 h-4 mr-1" />
 Reassign
 </Button>

 <Button variant="outline" size="sm">
 <Database className="w-4 h-4 mr-1" />
 View Details
 </Button>
 </div>
 </CardContent>
 </Card>
 )
 })}
 </div>

 {loading && (
 <div className="text-center py-12">
 <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
 <p className="text-muted-foreground mt-2">Loading lead pools...</p>
 </div>
 )}

 {filteredUploads.length === 0 && (
 <div className="text-center py-12">
 <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
 <p className="text-muted-foreground mt-2">
 No active lead pools found.
 </p>
 </div>
 )}
 </TabsContent>

 <TabsContent value="analytics" className="space-y-6">
 <div className="grid gap-6 md:grid-cols-3">
 <Card>
 <CardHeader>
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Uploads</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold">{uploads.length}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader>
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold">
 {uploads.reduce((sum, upload) => sum + upload.lead_count, 0)}
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader>
 <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Conversion</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold">
 {uploads.length > 0
 ? Math.round(uploads.reduce((sum, upload) => sum + (upload.done_count / upload.lead_count * 100), 0) / uploads.length)
 : 0}%
 </div>
 </CardContent>
 </Card>
 </div>

 {analytics && (
 <>
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Calendar className="w-5 h-5" />
 Upload Activity
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {Object.entries(analytics.uploadsByDay || {}).map(([date, dayData]: [string, any]) => (
 <div key={date} className="flex justify-between items-center py-2 border-b">
 <span>{new Date(date).toLocaleDateString()}</span>
 <div className="flex gap-4">
 <span className="text-sm">{dayData.uploads} uploads</span>
 <span className="text-sm">{dayData.total_leads} leads</span>
 <span className="text-sm text-green-600">{dayData.assigned_leads} assigned</span>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Trophy className="w-5 h-5" />
 Top Performing Uploads
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {(analytics.topUploads || []).map((upload: any, index: number) => (
 <div key={upload.display_name} className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
 index === 0 ? 'bg-yellow-500 text-white' :
 index === 1 ? 'bg-gray-300 text-gray-700' :
 index === 2 ? 'bg-orange-300 text-gray-700' : 'bg-muted'
 }`}>
 {index + 1}
 </div>
 <span>{upload.display_name}</span>
 </div>
 <div className="text-sm">
 <span className="text-green-600 font-medium">{upload.done_count}</span>
 <span className="text-muted-foreground ml-1">leads converted</span>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </>
 )}
 </TabsContent>

 <TabsContent value="operations" className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle>Recent Bulk Operations</CardTitle>
 </CardHeader>
 <CardContent>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Operation</TableHead>
 <TableHead>Upload</TableHead>
 <TableHead>Performed By</TableHead>
 <TableHead>Date</TableHead>
 <TableHead>Notes</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {operations.map((op) => (
 <TableRow key={op.id}>
 <TableCell>
 <Badge variant={op.operation_type === 'withdraw' ? 'destructive' : 'default'}>
 {op.operation_type}
 </Badge>
 </TableCell>
 <TableCell>{op.notes?.match(/from: (.+)/)?.[1] || '-'}</TableCell>
 <TableCell>{op.performed_by}</TableCell>
 <TableCell>{new Date(op.performed_at).toLocaleDateString()}</TableCell>
 <TableCell>{op.notes}</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 {/* Reassign Dialog */}
 <Dialog open={actionDialog === 'reassign' && !!selectedUpload} onOpenChange={() => setActionDialog(undefined)}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Reassign Leads</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <p>
 Reassign leads from <strong>{selectedUpload?.display_name}</strong> to users.
 </p>
 <div className="space-y-2">
 <Label htmlFor="leadsCount">Number of leads to reassign:</Label>
 <Input
 id="leadsCount"
 type="number"
 min="1"
 max={selectedUpload?.lead_count}
 value={leadsCount}
 onChange={(e) => setLeadsCount(parseInt(e.target.value) || 0)}
 />
 </div>
 <div className="flex gap-2">
 <Button variant="outline" onClick={() => setActionDialog(undefined)}>
 Cancel
 </Button>
 <Button onClick={handleReassign}>
 <UsersIcon className="w-4 h-4 mr-2" />
 Reassign Leads
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 )
}
