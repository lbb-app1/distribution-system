import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <div className="flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 mr-2" />
          <span className="font-bold text-lg">LBB Systems</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  LBB Lead Management System
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Welcome Warriors. Streamline your lead distribution, track performance, and dominate your sales targets.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button className="bg-white text-black hover:bg-gray-200" size="lg">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 border-gray-800 p-4 rounded-lg">
                <div className="p-2 bg-black rounded-full text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">Instant Distribution</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Upload leads and automatically distribute them to your team in seconds.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-gray-800 p-4 rounded-lg">
                <div className="p-2 bg-black rounded-full text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">Secure Tracking</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Monitor every lead's status with real-time updates and secure logging.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-gray-800 p-4 rounded-lg">
                <div className="p-2 bg-black rounded-full text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">Performance Analytics</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Visualize team performance and identify top performers with ease.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Let's Build Brand. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
