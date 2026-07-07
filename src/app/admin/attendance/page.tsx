'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Users, ChevronLeft, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AttendanceGroup {
 id: string
 username: string
 role: string
 records: Array<{
 id: string
 date: string
 total_tasks: number
 completed_tasks: number
 is_present: boolean
 }>
 total_present: number
 total_days: number
}

export default function AdminAttendancePage() {
 const [grouped, setGrouped] = useState<AttendanceGroup[]>([])
 const [loading, setLoading] = useState(true)
 const [days, setDays] = useState(30)
 const [currentDate, setCurrentDate] = useState(new Date())
 const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary')

 const fetchAttendance = async () => {
 setLoading(true)
 try {
 const dateStr = currentDate.toISOString().split('T')[0]
 const params = viewMode === 'detail' ? `date=${dateStr}` : `days=${days}`
 const res = await fetch(`/api/attendance/admin?${params}`)
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setGrouped(data.grouped || [])
 } catch (error) {
 console.error('Failed to fetch attendance:', error)
 toast.error('Failed to load attendance data')
 setGrouped([])
 } finally {
 setLoading(false)
 }
 }

 const handleDateChange = (days_count: number) => {
 const newDate = new Date()
 newDate.setDate(newDate.getDate() + days_count)
 setCurrentDate(newDate)
 }

 const toggleAttendance = async (recordId: string, isPresent: boolean, userId: string, date: string, completedTasks: number, totalTasks: number) => {
 try {
 await fetch('/api/attendance/mark', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 user_id: userId,
 date,
 completed_tasks: completedTasks,
 total_tasks: totalTasks,
 is_present: isPresent,
 })
 })
 fetchAttendance()
 toast.success('Attendance updated')
 } catch (error) {
 console.error('Failed to toggle attendance:', error)
 toast.error('Failed to update attendance')
 }
 }

 useEffect(() => {
 fetchAttendance()
 }, [days, viewMode])

 const overallPresent = grouped.reduce((sum, g) => sum + g.total_present, 0)
 const overallTotal = grouped.reduce((sum, g) => sum + g.total_days, 0)

 return (
 <div className="max-w-7xl mx-auto space-y-6 pb-20">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
 <p className="text-muted-foreground mt-1">
 {viewMode === 'summary' ? `Last ${days} days summary` : currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
 </p>
 </div>

 <div className="flex items-center gap-2 flex-wrap">
 {/* View toggle */}
 <Button
 variant={viewMode === 'summary' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setViewMode('summary')}
 >
 Summary
 </Button>
 <Button
 variant={viewMode === 'detail' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setViewMode('detail')}
 >
 Day Detail
 </Button>

 {viewMode === 'summary' ? (
 <div className="flex items-center gap-1">
 <Button variant="outline" size="sm" onClick={() => { setDays(30); setCurrentDate(new Date()) }} className={days === 30 ? 'ring-2 ring-primary' : ''}>30 Days</Button>
 <Button variant="outline" size="sm" onClick={() => { setDays(60); setCurrentDate(new Date()) }} className={days === 60 ? 'ring-2 ring-primary' : ''}>60 Days</Button>
 <Button variant="outline" size="sm" onClick={() => { setDays(90); setCurrentDate(new Date()) }} className={days === 90 ? 'ring-2 ring-primary' : ''}>90 Days</Button>
 </div>
 ) : (
 <>
 <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <Button variant="outline" size="icon" onClick={() => handleDateChange(1)} disabled={currentDate.toDateString() === new Date().toDateString()}>
 <ChevronRight className="w-4 h-4" />
 </Button>
 </>
 )}
 <Button variant="outline" size="icon" onClick={fetchAttendance}>
 <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
 </Button>
 </div>
 </div>

 {/* Stats */}
 <div className="grid gap-4 md:grid-cols-4">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{grouped.length}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Days Tracked</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{days}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Overall Present</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-green-600">{overallPresent}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0}%
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Users table */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Users className="w-5 h-5" />
 {viewMode === 'summary' ? 'User Attendance Summary' : 'Day Attendance Detail'}
 </CardTitle>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="flex items-center justify-center h-32">
 <RefreshCw className="w-6 h-6 animate-spin" />
 </div>
 ) : grouped.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 No attendance records found.
 </div>
 ) : viewMode === 'summary' ? (
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>User</TableHead>
 <TableHead className="text-center">Days Tracked</TableHead>
 <TableHead className="text-center">Present</TableHead>
 <TableHead className="text-center">Absent</TableHead>
 <TableHead className="text-right">Rate</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {grouped.map(user => {
 const rate = user.total_days > 0 ? Math.round((user.total_present / user.total_days) * 100) : 0
 return (
 <TableRow key={user.id}>
 <TableCell>
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
 {user.username.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-medium">{user.username}</div>
 <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
 </div>
 </div>
 </TableCell>
 <TableCell className="text-center">{user.total_days}</TableCell>
 <TableCell className="text-center text-green-600 font-medium">{user.total_present}</TableCell>
 <TableCell className="text-center text-red-600">{user.total_days - user.total_present}</TableCell>
 <TableCell className="text-right">
 <div className="flex items-center justify-end gap-2">
 <span className="font-medium">{rate}%</span>
 <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
 style={{ width: `${rate}%` }}
 />
 </div>
 </div>
 </TableCell>
 </TableRow>
 )
 })}
 </TableBody>
 </Table>
 </div>
 ) : (
 <div className="space-y-3">
 {grouped.map(user => {
 const record = user.records[0]
 return (
 <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
 {user.username.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-medium">{user.username}</div>
 <div className="text-sm text-muted-foreground">
 {record ? `${record.completed_tasks}/${record.total_tasks} tasks` : 'No record'}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <Badge variant={record?.is_present ? 'default' : 'secondary'} className={record?.is_present ? 'bg-green-600' : ''}>
 {record?.is_present ? 'Present' : 'Absent'}
 </Badge>
 {record && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => toggleAttendance(
 record.id,
 !record.is_present,
 user.id,
 record.date,
 record.completed_tasks,
 record.total_tasks
 )}
 >
 {record.is_present ? 'Mark Absent' : 'Mark Present'}
 </Button>
 )}
 </div>
 </div>
 )
 })}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
