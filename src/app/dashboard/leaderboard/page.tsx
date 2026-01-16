'use client'
import { useState, useEffect } from 'react'
import { LeaderboardPodium } from '@/components/leaderboard-podium'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, CheckCircle2, Flame, Trophy, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'

export default function LeaderboardPage() {
    const [stats, setStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {
        fetchStats()
        // Refresh every minute to show live updates if staying on page
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [currentDate])

    const fetchStats = async () => {
        setLoading(true)
        const res = await fetch(`/api/leaderboard?date=${currentDate.toISOString()}`)
        const data = await res.json()
        if (Array.isArray(data)) {
            setStats(data)
        }
        setLoading(false)
    }

    const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1))
    const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1))

    // Calculate Week Range Display
    // Note: API defines week starts Monday 9am. simple display: Monday - Sunday
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    const isCurrentWeek = new Date().toDateString() === currentDate.toDateString() || (currentDate > start && currentDate < end)

    if (loading && stats.length === 0) {
        return <div className="flex justify-center items-center h-96">Loading leaderboard...</div>
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col items-center space-y-4">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500">
                        Weekly Leaderboard
                    </h1>
                    <p className="text-muted-foreground">Resets every Monday at 9:00 AM</p>
                </div>

                <div className="flex items-center gap-4 bg-card p-2 rounded-full border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 min-w-[200px] justify-center font-medium">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextWeek}
                        disabled={new Date() < start} // Disable future weeks if strictly protecting, but let's allow "next week" which is empty. 
                    // Actually, let's disable going past "This Week" roughly?
                    // No, let users see empty future weeks if they want.
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <LeaderboardPodium users={stats} />

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Full Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Rank</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Time Spent</TableHead>
                                <TableHead className="text-right">Tasks</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((user, index) => (
                                <TableRow key={index} className={index < 3 ? 'bg-muted/30 font-medium' : ''}>
                                    <TableCell className="font-mono">
                                        {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                                        {index === 1 && <span className="text-slate-400 font-bold">#2</span>}
                                        {index === 2 && <span className="text-orange-400 font-bold">#3</span>}
                                        {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span>{user.username}</span>
                                            {index === 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-200">Leader</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {Math.floor(user.timeSpent / 60)}h {user.timeSpent % 60}m
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {user.tasks}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 font-bold text-primary">
                                            <Flame className="w-4 h-4 text-orange-500" />
                                            {user.points}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
