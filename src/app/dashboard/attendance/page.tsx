'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, CheckCircle2, Clock, TrendingUp, Users, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AttendanceRecord {
 user_id: string
 date: string
 total_tasks: number
 completed_tasks: number
 is_present: boolean
 tasks: Array<{
 id: string
 lead_id: string
 lead: {
 lead_identifier: string
 status: string
 sub_status: string
 }
 is_completed: boolean
 }>
}

export default function AttendancePage() {
 const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
 const [loading, setLoading] = useState(true)
 const [syncing, setSyncing] = useState(false)
 const today = new Date().toISOString().split('T')[0]

 const fetchAttendance = async () => {
 try {
 const res = await fetch(`/api/attendance?date=${today}`)
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)
 setAttendance(data)
 } catch (error) {
 console.error('Failed to fetch attendance:', error)
 toast.error('Failed to load attendance data')
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
 body: JSON.stringify({ date: today })
 })
 const data = await res.json()
 if (!res.ok) throw new Error(data.error)

 await fetchAttendance()
 toast.success('Tasks synced successfully!')
 } catch (error) {
 console.error('Failed to sync tasks:', error)
 toast.error('Failed to sync tasks')
 } finally {
 setSyncing(false)
 }
 }

 const toggleTask = async (taskId: string, completed: boolean) => {
 try {
 const res = await fetch(`/api/leads/${taskId}/status`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ is_completed: completed })
 })

 if (!res.ok) throw new Error('Failed to update task')

 await fetchAttendance()
 } catch (error) {
 console.error('Failed to toggle task:', error)
 toast.error('Failed to update task')
 }
 }

 useEffect(() => {
 fetchAttendance()
 }, [])

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <RefreshCw className="w-6 h-6 animate-spin" />
 </div>
 )
 }

 return (
 <div className="max-w-4xl mx-auto space-y-6 pb-20">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Daily Attendance</h1>
 <p className="text-muted-foreground mt-1">
 {new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
 </p>
 </div>
 <Button onClick={syncTasks} disabled={syncing}>
 <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
 Sync Tasks
 </Button>
 </div>

 {attendance && (
 <>
 {/* Attendance Summary */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2">
 <Calendar className="w-5 h-5" />
 Daily Progress
 </CardTitle>
 <Badge variant={attendance.is_present ? 'default' : 'secondary'}>
 {attendance.is_present ? 'Present' : 'Not Marked'}
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <span>Task Completion</span>
 <span className="font-medium">
 {attendance.completed_tasks} / {attendance.total_tasks} ({Math.round((attendance.completed_tasks / attendance.total_tasks) * 100)}%)
 </span>
 </div>
 <Progress value={attendance.total_tasks > 0 ? (attendance.completed_tasks / attendance.total_tasks) * 100 : 0} className="w-full" />
 <div className="text-sm text-muted-foreground">
 {attendance.completed_tasks === attendance.total_tasks && attendance.total_tasks > 0 ? (
 <span className="text-green-600 flex items-center gap-1">
 <CheckCircle2 className="w-4 h-4" />
 All tasks completed! Marked as present.
 </span>
 ) : attendance.completed_tasks === 0 && attendance.total_tasks > 0 ? (
 <span className="text-orange-600 flex items-center gap-1">
 <Clock className="w-4 h-4" />
 No tasks completed yet.
 </span>
 ) : (
 <span className="text-blue-600">
 Keep working! You have {attendance.total_tasks - attendance.completed_tasks} tasks remaining.
 </span>
 )}
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Tasks List */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Users className="w-5 h-5" />
 Assigned Leads ({attendance.tasks.length})
 </CardTitle>
 </CardHeader>
 <CardContent>
 {attendance.tasks.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 No leads assigned for today.
 </div>
 ) : (
 <div className="space-y-3">
 {attendance.tasks.map((task) => (
 <div
 key={task.id}
 className="flex items-center justify-between p-3 border rounded-lg"
 >
 <div className="flex items-center gap-3">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => toggleTask(task.lead_id, !task.is_completed)}
 className={cn(
 task.is_completed && 'text-green-600',
 'hover:bg-primary/10'
 )}
 >
 {task.is_completed ? (
 <CheckCircle2 className="w-5 h-5" />
 ) : (
 <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
 )}
 </Button>
 <div>
 <div className="font-medium">{task.lead.lead_identifier}</div>
 <div className="text-sm text-muted-foreground">
 Status: {task.lead.status}
 {task.lead.sub_status && ` - ${task.lead.sub_status}`}
 </div>
 </div>
 </div>
 <Badge variant={task.is_completed ? 'default' : 'secondary'}>
 {task.is_completed ? 'Completed' : 'Pending'}
 </Badge>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Streak Info (if implemented) */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <TrendingUp className="w-5 h-5" />
 Daily Performance
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="text-center">
 <div className="text-2xl font-bold text-primary">{attendance.completed_tasks}</div>
 <div className="text-sm text-muted-foreground">Completed</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-yellow-600">{attendance.total_tasks - attendance.completed_tasks}</div>
 <div className="text-sm text-muted-foreground">Remaining</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-green-600">
 {attendance.is_present ? '1' : '0'}
 </div>
 <div className="text-sm text-muted-foreground">Days Present</div>
 </div>
 <div className="text-center">
 <div className="text-2xl font-bold text-blue-600">
 {Math.round((attendance.completed_tasks / attendance.total_tasks) * 100)}%
 </div>
 <div className="text-sm text-muted-foreground">Completion</div>
 </div>
 </div>
 </CardContent>
 </Card>
 </>
 )}
 </div>
 )
}
