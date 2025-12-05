'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, History, User, LogOut } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-muted/40 dark:bg-muted/40">
            <nav className="bg-background border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold">Lead System</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-foreground border-b-2 border-transparent hover:border-border">
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    Today's Leads
                                </Link>
                                <Link href="/dashboard/history" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border">
                                    <History className="w-4 h-4 mr-2" />
                                    History
                                </Link>
                                <Link href="/dashboard/profile" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border">
                                    <User className="w-4 h-4 mr-2" />
                                    Profile
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ModeToggle />
                            <Button variant="ghost" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}
