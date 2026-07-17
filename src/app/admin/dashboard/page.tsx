'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, FileText, Users } from 'lucide-react'

export default function AdminDashboard() {
 const [stats, setStats] = useState({ totalLeadsToday: 0, completedTotal: 0, pendingTotal: 0, totalUsers: 0 })
 const [userPerformance, setUserPerformance] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchData = async () => {
 try {
 const [statsRes, analyticsRes] = await Promise.all([
 fetch('/api/dashboard/stats').then(r => r.json()),
 fetch('/api/analytics/summary').then(r => r.json())
 ])

 if (!statsRes.error) {
 setStats(statsRes)
 }
 if (analyticsRes.userPerformance) {
 setUserPerformance(analyticsRes.userPerformance)
 }
 } catch (error) {
 console.error('Failed to fetch data', error)
 } finally {
 setLoading(false)
 }
 }
 fetchData()
 }, [])

 if (loading) {
 return <div className="text-center py-8">Loading...</div>
 }

 return (
 <div className="space-y-8 max-w-6xl mx-auto">
 <div>
 <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
 <p className="text-muted-foreground mt-1">Real-time insights into lead distribution and performance.</p>
 </div>

 <div className="grid gap-6 md:grid-cols-3">
 <Card className="shadow-sm border-l-4 border-l-blue-500">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads (Today)</CardTitle>
 <FileText className="h-4 w-4 text-blue-500" />
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold">{stats.totalLeadsToday}</div>
 <p className="text-xs text-muted-foreground mt-1">Uploaded today</p>
 </CardContent>
 </Card>

 <Card className="shadow-sm border-l-4 border-l-green-500">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
 <CheckCircle2 className="h-4 w-4 text-green-500" />
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold">{stats.completedTotal}</div>
 <p className="text-xs text-muted-foreground mt-1">Leads processed</p>
 </CardContent>
 </Card>

 <Card className="shadow-sm border-l-4 border-l-yellow-500">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
 <Clock className="h-4 w-4 text-yellow-500" />
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-bold">{stats.pendingTotal}</div>
 <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
 </CardContent>
 </Card>
 </div>

 <div className="space-y-4">
 <div className="flex items-center space-x-2">
 <Users className="h-5 w-5 text-primary" />
 <h3 className="text-xl font-semibold tracking-tight">User Performance</h3>
 </div>
 <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-muted/40">
 <tr>
 <th className="text-left p-3">User</th>
 <th className="text-center p-3">Assigned</th>
 <th className="text-center p-3">Completed</th>
 <th className="text-right p-3">Completion Rate</th>
 </tr>
 </thead>
 <tbody>
 {userPerformance.map((user, idx) => {
 const rate = user.assigned > 0 ? Math.round((user.completed / user.assigned) * 100) : 0
 return (
 <tr key={idx} className="border-t">
 <td className="p-3 font-medium">{user.username}</td>
 <td className="text-center p-3">{user.assigned}</td>
 <td className="text-center p-3">{user.completed}</td>
 <td className="text-right p-3">
 <div className="flex items-center justify-end space-x-2">
 <span className="text-sm font-medium">{rate}%</span>
 <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
 style={{ width: `${rate}%` }}
 />
 </div>
 </div>
 </td>
 </tr>
 )
 })}
 {userPerformance.length === 0 && (
 <tr>
 <td colSpan={4} className="text-center py-8 text-muted-foreground">No performance data available.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )
}
