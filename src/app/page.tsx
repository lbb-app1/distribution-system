import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Lead Distribution System
        </h1>
        <p className="text-lg leading-8 text-gray-600">
          Efficiently manage and distribute leads to your team.
        </p>
        <div className="flex items-center justify-center gap-x-6">
          <Link href="/login">
            <Button size="lg">Login to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
