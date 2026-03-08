'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/services/auth'
import { useAuthStore } from '@/stores/auth-store'
import { User } from '@/types/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { auth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a session in Supabase
        const user = await getCurrentUser()
        
        if (user) {
          // User is authenticated, update store
          auth.setUser(user)
        } else {
          // No valid session, clear store
          auth.reset()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Clear any invalid session data
        auth.reset()
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [auth])

  // Show loading state while checking authentication
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
