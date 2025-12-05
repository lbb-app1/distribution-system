'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, Upload, BarChart3, LogOut, Menu } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 flex justify-between items-center">
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <ModeToggle />
            </div>
            <nav className="mt-6 flex-1">
                <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="flex items-center px-6 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Dashboard
                </Link>
                <Link href="/admin/assign" onClick={() => setOpen(false)} className="flex items-center px-6 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Upload className="w-5 h-5 mr-3" />
                    Assign Leads
                </Link>
                <Link href="/admin/users" onClick={() => setOpen(false)} className="flex items-center px-6 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Users className="w-5 h-5 mr-3" />
                    Users
                </Link>
                <Link href="/admin/analytics" onClick={() => setOpen(false)} className="flex items-center px-6 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <BarChart3 className="w-5 h-5 mr-3" />
                    Analytics
                </Link>
            </nav>
            <div className="p-6">
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen bg-muted/40 dark:bg-muted/40">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 bg-background border-r shadow-sm">
                <SidebarContent />
            </div>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="md:hidden p-4 border-b bg-background flex items-center justify-between">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-lg font-bold">Admin Panel</h1>
                    <div className="w-6" /> {/* Spacer for centering if needed, or just empty */}
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    )
}
