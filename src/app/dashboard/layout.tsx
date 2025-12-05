'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, History, User, LogOut, Menu } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    const NavLinks = ({ mobile = false }) => (
        <>
            <Link
                href="/dashboard"
                onClick={() => mobile && setOpen(false)}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-border ${mobile ? 'w-full py-3' : 'text-foreground'}`}
            >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Today's Leads
            </Link>
            <Link
                href="/dashboard/history"
                onClick={() => mobile && setOpen(false)}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border ${mobile ? 'w-full py-3' : ''}`}
            >
                <History className="w-4 h-4 mr-2" />
                History
            </Link>
            <Link
                href="/dashboard/profile"
                onClick={() => mobile && setOpen(false)}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border ${mobile ? 'w-full py-3' : ''}`}
            >
                <User className="w-4 h-4 mr-2" />
                Profile
            </Link>
        </>
    )

    return (
        <div className="min-h-screen bg-muted/40 dark:bg-muted/40">
            <nav className="bg-background border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            {/* Mobile Menu Trigger */}
                            <div className="sm:hidden mr-2">
                                <Sheet open={open} onOpenChange={setOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Menu className="w-6 h-6" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-64">
                                        <div className="flex flex-col space-y-4 mt-6">
                                            <NavLinks mobile />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold">Lead System</h1>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <NavLinks />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ModeToggle />
                            <Button variant="ghost" onClick={handleLogout} className="hidden sm:flex">
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                            'use client'
                            import {useRouter} from 'next/navigation'
                            import Link from 'next/link'
                            import {Button} from '@/components/ui/button'
                            import {LayoutDashboard, History, User, LogOut, Menu} from 'lucide-react'
                            import {ModeToggle} from '@/components/mode-toggle'
                            import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet'
                            import {useState} from 'react'

                            export default function UserLayout({children}: {children: React.ReactNode }) {
    const router = useRouter()
                            const [open, setOpen] = useState(false)

    const handleLogout = async () => {
                                await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

                            const NavLinks = ({mobile = false}) => (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={() => mobile && setOpen(false)}
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-border ${mobile ? 'w-full py-3' : 'text-foreground'}`}
                                >
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    Today's Leads
                                </Link>
                                <Link
                                    href="/dashboard/history"
                                    onClick={() => mobile && setOpen(false)}
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border ${mobile ? 'w-full py-3' : ''}`}
                                >
                                    <History className="w-4 h-4 mr-2" />
                                    History
                                </Link>
                                <Link
                                    href="/dashboard/profile"
                                    onClick={() => mobile && setOpen(false)}
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border ${mobile ? 'w-full py-3' : ''}`}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Profile
                                </Link>
                            </>
                            )

                            return (
                            <div className="min-h-screen bg-muted/40 dark:bg-muted/40">
                                <nav className="bg-background border-b shadow-sm">
                                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                        <div className="flex justify-between h-16">
                                            <div className="flex items-center">
                                                {/* Mobile Menu Trigger */}
                                                <div className="sm:hidden mr-2">
                                                    <Sheet open={open} onOpenChange={setOpen}>
                                                        <SheetTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Menu className="w-6 h-6" />
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent side="left" className="w-64">
                                                            <div className="flex flex-col space-y-4 mt-6">
                                                                <NavLinks mobile />
                                                            </div>
                                                        </SheetContent>
                                                    </Sheet>
                                                </div>

                                                <div className="flex-shrink-0 flex items-center">
                                                    <h1 className="text-xl font-bold">Lead System</h1>
                                                </div>
                                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                                    <NavLinks />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <ModeToggle />
                                                <Button variant="ghost" onClick={handleLogout} className="hidden sm:flex">
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Logout
                                                </Button>
                                                {/* Mobile Logout Icon Only */}
                                                <Button variant="ghost" size="icon" onClick={handleLogout} className="sm:hidden">
                                                    <LogOut className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </nav>

                                <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                                    {children}
                                </main>
                            </div>
                            )
}
