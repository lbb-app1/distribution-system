'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalLeads: 0, completed: 0, pending: 0 })
    const [userPerformance, setUserPerformance] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch summary stats
                const resStats = await fetch('/api/leads')
                const dataStats = await resStats.json()
                if (Array.isArray(dataStats)) {
                    setStats({
                        totalLeads: dataStats.length,
                        completed: dataStats.filter((l: any) => l.status === 'done').length,
                        pending: dataStats.filter((l: any) => l.status === 'pending').length
                    })
                }

                // Fetch user performance
                const resAnalytics = await fetch('/api/analytics/summary')
                const dataAnalytics = await resAnalytics.json()
                if (dataAnalytics.userPerformance) {
                    setUserPerformance(dataAnalytics.userPerformance)
                }
            } catch (error) {
                console.error('Failed to fetch data', error)
            }
        }
        fetchData()
    }, [])

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
                        <div className="text-3xl font-bold">{stats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">Uploaded today</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground mt-1">Leads processed</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold tracking-tight">User Performance</h3>
                </div>
                <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="text-center">Assigned</TableHead>
                                <TableHead className="text-center">Completed</TableHead>
                                <TableHead className="text-right">Completion Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userPerformance.map((user, idx) => {
                                const rate = user.assigned > 0 ? Math.round((user.completed / user.assigned) * 100) : 0
                                return (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell className="text-center">{user.assigned}</TableCell>
                                        <TableCell className="text-center">{user.completed}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <span className="text-sm font-medium">{rate}%</span>
                                                <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
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
                            {userPerformance.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No performance data available.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
