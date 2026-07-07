'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, CheckCircle2, Clock, Users, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceRecord {
 id: string
 user_id: string
 date: string
 total_tasks: number
 completed_tasks: number
 is_present: boolean
 marked_at: string
 notes: string
 user: {
 id: string
 username: string
 role: string
 }
}

export default function AdminAttendancePage() {
 const [records, setRecords] = useState<AttendanceRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [currentDate, setCurrentDate] = useState(new Date())
 const [mode, setMode] = useState<'day' | 'month'>('day')

 const fetchAttendance = async () => {
 setLoading(true)
 try {
 const dateStr = currentDate.toISOString().split('T')[0]
 const monthStr = currentDate.toISOString().slice(0, 7) // "2025-01"
 const params = mode === 'day' ? `date=${dateStr}` : `month=${monthStr}`
 const res = await fetch(`/api/attendance/admin?${params}`)
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setRecords(Array.isArray(data) ? data : [])
 } catch (error) {
 console.error('Failed to fetch attendance:', error)
 toast.error('Failed to load attendance data')
 setRecords([])
 } finally {
 setLoading(false)
 }
 }

 const handleDateChange = (days: number) => {
 const newDate = new Date(currentDate)
 newDate.setDate(newDate.getDate() + days)
 setCurrentDate(newDate)
 }

 const handleMonthChange = (months: number) => {
 const newDate = new Date(currentDate)
 newDate.setMonth(newDate.getMonth() + months)
 setCurrentDate(newDate)
 }

 const toggleAttendance = async (recordId: string, isPresent: boolean, completedTasks: number, totalTasks: number) => {
 try {
 const res = await fetch('/api/attendance/mark', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 user_id: records.find(r => r.id === recordId)?.user_id,
 date: records.find(r => r.id === recordId)?.date,
 completed_tasks: completedTasks,
 total_tasks: totalTasks,
 is_present: isPresent,
 })
 })

 if (!res.ok) throw new Error('Failed to update attendance')

 setRecords(prev => prev.map(r => r.id === recordId ? { ...r, is_present: isPresent } : r))
 toast.success('Attendance updated')
 } catch (error) {
 console.error('Failed to toggle attendance:', error)
 toast.error('Failed to update attendance')
 }
 }

 useEffect(() => {
 fetchAttendance()
 }, [currentDate, mode])

 const isToday = currentDate.toDateString() === new Date().toDateString()
 const presentCount = records.filter(r => r.is_present).length

 return (
 <div className="max-w-6xl mx-auto space-y-6 pb-20">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
 <p className="text-muted-foreground mt-1">
 {mode === 'day'
 ? currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
 : currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
 </p>
 </div>

 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" onClick={() => setMode(mode === 'day' ? 'month' : 'day')}>
 {mode === 'day' ? 'Month View' : 'Day View'}
 </Button>
 <Button variant="outline" size="icon" onClick={() => mode === 'day' ? handleDateChange(-1) : handleMonthChange(-1)}>
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <Button variant="outline" size="icon" onClick={() => mode === 'day' ? handleDateChange(1) : handleMonthChange(1)} disabled={isToday && mode === 'day'}>
 <ChevronRight className="w-4 h-4" />
 </Button>
 <Button variant="outline" size="icon" onClick={fetchAttendance}>
 <RefreshCw className="w-4 h-4" />
 </Button>
 </div>
 </div>

 {/* Summary Stats */}
 <div className="grid gap-6 md:grid-cols-4">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{records.length}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-green-600">{presentCount}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-red-600">{records.length - presentCount}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0}%
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Attendance Table */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Users className="w-5 h-5" />
 Attendance Records
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>User</TableHead>
 <TableHead className="text-center">Tasks</TableHead>
 <TableHead className="text-center">Completed</TableHead>
 <TableHead className="text-center">Status</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={5} className="text-center py-8">
 <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
 </TableCell>
 </TableRow>
 ) : records.length === 0 ? (
 <TableRow>
 <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
 No attendance records found for this {mode}.
 </TableCell>
 </TableRow>
 ) : (
 records.map((record) => {
 const completionRate = record.total_tasks > 0 ? Math.round((record.completed_tasks / record.total_tasks) * 100) : 0
 const shouldBePresent = completionRate === 100 && record.total_tasks > 0

 return (
 <TableRow key={record.id}>
 <TableCell className="font-medium">
 <div className="flex items-center gap-2">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${record.user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
 {record.user.username.charAt(0).toUpperCase()}
 </div>
 <div>
 <div>{record.user.username}</div>
 <div className="text-xs text-muted-foreground capitalize">{record.user.role}</div>
 </div>
 </div>
 </TableCell>
 <TableCell className="text-center">{record.total_tasks}</TableCell>
 <TableCell className="text-center">
 <span className={`${record.completed_tasks === record.total_tasks ? 'text-green-600 font-medium' : ''}`}>
 {record.completed_tasks} / {record.total_tasks}
 </span>
 </TableCell>
 <TableCell className="text-center">
 <Badge variant={record.is_present ? 'default' : shouldBePresent ? 'default' : 'secondary'} className={record.is_present || shouldBePresent ? 'bg-green-600' : ''}>
 {record.is_present ? 'Present' : shouldBePresent ? 'Should Be Present' : 'Absent'}
 </Badge>
 </TableCell>
 <TableCell className="text-right">
 <Button
 variant="outline"
 size="sm"
 onClick={() => toggleAttendance(
 record.id,
 !record.is_present,
 record.completed_tasks,
 record.total_tasks
 )}
 >
 {record.is_present ? 'Mark Absent' : 'Mark Present'}
 </Button>
 </TableCell>
 </TableRow>
 )
 })
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>
 </div>
 )
}
