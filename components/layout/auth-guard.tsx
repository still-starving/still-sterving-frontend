"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getAuthToken } from "@/lib/api"

const publicRoutes = ["/login", "/register"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!token && !isPublicRoute) {
      setIsChecking(false)
      router.push("/login")
    } else if (token && isPublicRoute) {
      setIsChecking(false)
      router.push("/")
    } else {
      setIsChecking(false)
    }
  }, [pathname, router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
