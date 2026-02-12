'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect based on role
      if (user?.role === 'ADMIN') {
        router.push('/dashboard')
      } else {
        router.push('/projects')
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-indigo-600">
            CetaProjects
          </CardTitle>
          <CardDescription className="text-lg">
            Project Management Made Simple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/auth/login')}
            >
              Sign In
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/auth/register')}
            >
              Create Account
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              📱 Mobile-first PWA
            </p>
            <p className="text-sm text-center text-muted-foreground mt-1">
              🔔 Multi-channel notifications
            </p>
            <p className="text-sm text-center text-muted-foreground mt-1">
              ✅ Project approval workflow
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
