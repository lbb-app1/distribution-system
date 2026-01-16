'use client'
import { useEffect } from 'react'

export function ActivityTracker() {
    useEffect(() => {
        const interval = setInterval(() => {
            // Check if document is focused to only track active time
            if (document.visibilityState === 'visible') {
                fetch('/api/activity/heartbeat', { method: 'POST' })
            }
        }, 60000) // Every 1 minute

        return () => clearInterval(interval)
    }, [])

    return null
}
