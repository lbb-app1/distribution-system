'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Clock, CheckCircle, Flame } from 'lucide-react'
import { motion } from 'framer-motion'

export function LeaderboardPodium({ users }: { users: any[] }) {
    if (users.length === 0) return null

    const first = users[0]
    const second = users[1]
    const third = users[2]

    return (
        <div className="flex flex-col items-center justify-end h-[400px] mb-12 w-full max-w-3xl mx-auto relative mt-12">

            {/* 2nd Place */}
            {second && (
                <div className="absolute left-[10%] bottom-0 flex flex-col items-center z-10 w-[25%]">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center w-full"
                    >
                        <div className="mb-4 text-center">
                            <div className="font-bold text-lg md:text-xl truncate w-full">{second.username}</div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center">
                                <Flame className="w-3 h-3 mr-1 text-orange-500" />
                                {second.points} pts
                            </div>
                        </div>
                        <div className="h-40 w-full bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-t-lg shadow-lg flex items-start justify-center pt-4 relative border-t border-l border-r border-slate-400 dark:border-slate-600">
                            <div className="text-4xl font-bold opacity-20 text-slate-900 dark:text-white">2</div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* 1st Place */}
            <div className="absolute left-[37.5%] bottom-0 flex flex-col items-center z-20 w-[25%] mb-8">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center w-full scale-110 origin-bottom"
                >
                    <Trophy className="w-12 h-12 text-yellow-500 mb-2 drop-shadow-md animate-pulse" />
                    <div className="mb-4 text-center bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm">
                        <div className="font-bold text-xl md:text-2xl text-primary truncate w-full">{first.username}</div>
                        <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                            <Flame className="w-4 h-4 mr-1 text-orange-500" />
                            {first.points} pts
                        </div>
                    </div>
                    <div className="h-56 w-full bg-gradient-to-t from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/20 rounded-t-lg shadow-xl flex items-start justify-center pt-6 border-t border-l border-r border-yellow-200 dark:border-yellow-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
                        <div className="text-6xl font-bold text-yellow-500/50">1</div>
                    </div>
                </motion.div>
            </div>

            {/* 3rd Place */}
            {third && (
                <div className="absolute right-[10%] bottom-0 flex flex-col items-center z-10 w-[25%]">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center w-full"
                    >
                        <div className="mb-4 text-center">
                            <div className="font-bold text-lg md:text-xl truncate w-full">{third.username}</div>
                            <div className="text-sm text-muted-foreground flex items-center justify-center">
                                <Flame className="w-3 h-3 mr-1 text-orange-500" />
                                {third.points} pts
                            </div>
                        </div>
                        <div className="h-32 w-full bg-gradient-to-t from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/20 rounded-t-lg shadow-lg flex items-start justify-center pt-4 border-t border-l border-r border-orange-200 dark:border-orange-700">
                            <div className="text-4xl font-bold opacity-20 text-orange-900 dark:text-white">3</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
