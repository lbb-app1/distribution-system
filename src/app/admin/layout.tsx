'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, Upload, BarChart3, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>
                <nav className="mt-6">
                    <Link href="/admin/dashboard" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link href="/admin/assign" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                        <Upload className="w-5 h-5 mr-3" />
                        Assign Leads
                    </Link>
                    <Link href="/admin/users" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                        <Users className="w-5 h-5 mr-3" />
                        Users
                    </Link>
                    <Link href="/admin/analytics" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                        <BarChart3 className="w-5 h-5 mr-3" />
                        Analytics
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-6">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    )
}
