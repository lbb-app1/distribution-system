'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
 Calendar,
 CheckCircle2,
 Clock,
 TrendingUp,
 Users,
 RefreshCw,
 CalendarDays,
 MapPin,
 List
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
 id: string
 date: string
 total_tasks: number
 completed_tasks: number
 is_present: boolean
}

interface CalendarDay {
 date: string
 label: string
 status: 'present' | 'absent' | 'none'
}

export default function AttendancePage() {
 const [today, setToday] = useState<AttendanceRecord | null>(null)
 const [history, setHistory] = useState<AttendanceRecord[]>([])
 const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
 const [summary, setSummary] = useState<{
 totalDays: number
 presentDays: number
 absentDays: number
 attendanceRate: number
 } | null>(null)
 const [loading, setLoading] = useState(true)
 const [syncing, setSyncing] = useState(false)
 const [range, setRange] = useState(30)

 const fetchToday = async () => {
 try {
 const dateStr = new Date().toISOString().split('T')[0]
 const res = await fetch(`/api/attendance?date=${dateStr}`)
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setToday(data)
 } catch (error) {
 console.error('Failed to fetch today:', error)
 toast.error('Failed to load today attendance')
 }
 }

 const fetchHistory = async () => {
 setLoading(true)
 try {
 const res = await fetch(`/api/attendance/history?range=${range}`)
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setHistory(data.records)
 setCalendarDays(data.calendarDays)
 setSummary(data.summary)
 } catch (error) {
 console.error('Failed to fetch history:', error)
 toast.error('Failed to load attendance history')
 } finally {
 setLoading(false)
 }
 }

 const syncTasks = async () => {
 setSyncing(true)
 try {
 const res = await fetch('/api/attendance/tasks', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)

 await fetchToday()
 await fetchHistory()
 toast.success('Tasks synced successfully!')
 } catch (error) {
 console.error('Failed to sync tasks:', error)
 toast.error('Failed to sync tasks')
 } finally {
 setSyncing(false)
 }
 }

 useEffect(() => {
 fetchToday()
 fetchHistory()
 }, [range])

 const renderCalendar = () => {
 const today = new Date()
 return (
 <div className="grid grid-cols-7 gap-1">
 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
 <div key={day} className="text-center font-medium text-xs text-muted-foreground py-2">
 {day}
 </div>
 ))}
 {calendarDays.map((day, index) => (
 <div key={day.date} className="aspect-square">
 <button
 className={cn(
 'w-full h-full rounded flex flex-col items-center justify-center text-xs',
 day.status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
 day.status === 'absent' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
 'bg-muted hover:bg-muted/80'
 )}
 onClick={() => {
 const date = new Date(day.date)
 setRange(range) // Keep current range
 }}
 >
 <div>{day.label.split(' ')[1]}</div>
 <div className={`w-2 h-2 rounded-full mt-1 ${
 day.status === 'present' ? 'bg-green-600' :
 day.status === 'absent' ? 'bg-red-600' : ''
 }`} />
 </button>
 </div>
 ))}
 </div>
 )
 }

 return (
 <div className="max-w-6xl mx-auto space-y-6 pb-20">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
 <p className="text-muted-foreground mt-1">
 Track your daily performance and attendance history
 </p>
 </div>
 <Button onClick={syncTasks} disabled={syncing}>
 <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
 Sync Today's Tasks
 </Button>
 </div>

 {/* Tabs */}
 <Tabs value="today" onValueChange={(value) => value === 'today' ? setRange(1) : null}>
 <TabsList className="grid w-full grid-cols-3">
 <TabsTrigger value="today">Today's Progress</TabsTrigger>
 <TabsTrigger value="history">History</TabsTrigger>
 <TabsTrigger value="calendar">Calendar View</TabsTrigger>
 </TabsList>

 <TabsContent value="today" className="space-y-6">
 {/* Today's Summary */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2">
 <Calendar className="w-5 h-5" />
 Today's Tasks
 </CardTitle>
 <Badge variant={today?.is_present ? 'default' : 'secondary'}>
 {today?.is_present ? 'Present' : 'Not Marked'}
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 {today && today.total_tasks > 0 ? (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <span>Task Completion</span>
 <span className="font-medium">
 {today.completed_tasks} / {today.total_tasks} ({Math.round((today.completed_tasks / today.total_tasks) * 100)}%)
 </span>
 </div>
 <Progress value={(today.completed_tasks / today.total_tasks) * 100} className="w-full" />
 <div className="text-sm text-muted-foreground">
 {today.completed_tasks === today.total_tasks ? (
 <span className="text-green-600 flex items-center gap-1">
 <CheckCircle2 className="w-4 h-4" />
 All tasks completed! Marked as present.
 </span>
 ) : today.completed_tasks === 0 ? (
 <span className="text-orange-600 flex items-center gap-1">
 <Clock className="w-4 h-4" />
 No tasks completed yet.
 </span>
 ) : (
 <span className="text-blue-600">
 Keep working! You have {today.total_tasks - today.completed_tasks} tasks remaining.
 </span>
 )}
 </div>
 </div>
 ) : (
 <div className="text-center py-8 text-muted-foreground">
 No leads assigned for today. Click "Sync Tasks" to check if new leads were assigned.
 </div>
 )}
 </CardContent>
 </Card>

 {/* Task List (placeholder - would fetch from today's tasks) */}
 {today && today.total_tasks > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <List className="w-5 h-5" />
 Assigned Leads
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-muted-foreground">
 Task list functionality will be implemented based on your specific leads structure.
 </p>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 <TabsContent value="history" className="space-y-6">
 {/* History Controls */}
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-semibold">Attendance History</h2>
 <div className="flex items-center gap-2">
 <Button
 variant={range === 30 ? 'default' : 'outline'}
 size="sm"
 onClick={() => setRange(30)}
 >
 30 Days
 </Button>
 <Button
 variant={range === 60 ? 'default' : 'outline'}
 size="sm"
 onClick={() => setRange(60)}
 >
 60 Days
 </Button>
 <Button
 variant={range === 90 ? 'default' : 'outline'}
 size="sm"
 onClick={() => setRange(90)}
 >
 90 Days
 </Button>
 </div>
 </div>

 {/* Summary Stats */}
 {summary && (
 <div className="grid gap-4 md:grid-cols-4">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Days</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{summary.totalDays}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-red-600">{summary.absentDays}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{summary.attendanceRate}%</div>
 </CardContent>
 </Card>
 </div>
 )}

 {/* History Table */}
 <Card>
 <CardHeader>
 <CardTitle>Recent Attendance</CardTitle>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="flex items-center justify-center h-32">
 <RefreshCw className="w-6 h-6 animate-spin" />
 </div>
 ) : history.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 No attendance records found for the selected period.
 </div>
 ) : (
 <div className="space-y-2">
 {history.map(record => (
 <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
 <div className="flex items-center gap-3">
 <CalendarDays className="w-4 h-4 text-muted-foreground" />
 <div>
 <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
 <div className="text-sm text-muted-foreground">
 {record.completed_tasks}/{record.total_tasks} tasks completed
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={record.is_present ? 'default' : 'secondary'} className={record.is_present ? 'bg-green-600' : ''}>
 {record.is_present ? 'Present' : 'Absent'}
 </Badge>
 {record.is_present ? (
 <CheckCircle2 className="w-4 h-4 text-green-600" />
 ) : (
 <Clock className="w-4 h-4 text-red-600" />
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="calendar" className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Calendar className="w-5 h-5" />
 Calendar View ({range} days)
 </CardTitle>
 </CardHeader>
 <CardContent>
 {loading ? (
 <div className="flex items-center justify-center h-32">
 <RefreshCw className="w-6 h-6 animate-spin" />
 </div>
 ) : (
 <div>
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-4 text-sm">
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-green-600 rounded-full" />
 <span>Present</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-red-600 rounded-full" />
 <span>Absent</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-3 h-3 bg-muted rounded-full" />
 <span>No data</span>
 </div>
 </div>
 <div className="text-sm text-muted-foreground">
 Click on dates to view details
 </div>
 </div>
 {renderCalendar()}
 {summary && (
 <div className="mt-6 p-4 bg-muted rounded-lg">
 <div className="text-center">
 <div className="text-lg font-semibold">{summary.attendanceRate}%</div>
 <div className="text-sm text-muted-foreground">Attendance Rate</div>
 </div>
 </div>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}