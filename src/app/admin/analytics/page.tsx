'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function AnalyticsPage() {
    const [data, setData] = useState<{ daily: any[], userPerformance: any[] }>({ daily: [], userPerformance: [] })

    useEffect(() => {
        fetch('/api/analytics/summary')
            .then(res => res.json())
            .then(setData)
    }, [])

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.daily}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="uploaded" stroke="#8884d8" name="Uploaded" />
                                    <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.userPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="username" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="assigned" fill="#8884d8" name="Assigned" />
                                    <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
