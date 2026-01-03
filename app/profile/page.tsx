"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, User, Mail, Calendar, Utensils, Heart, MessageSquare, Award } from "lucide-react"

interface Profile {
  name: string
  email: string
  joinDate: string
  stats: {
    foodShared: number
    foodReceived: number
    hungerBroadcasts: number
    impactScore: number
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = (await api.getProfile()) as Profile
        setProfile(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: error instanceof Error ? error.message : "Something went wrong.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthGuard>
    )
  }

  if (!profile) return null

  const stats = [
    {
      icon: Utensils,
      label: "Food Shared",
      value: profile.stats.foodShared,
      color: "text-primary",
    },
    {
      icon: Heart,
      label: "Food Received",
      value: profile.stats.foodReceived,
      color: "text-secondary",
    },
    {
      icon: MessageSquare,
      label: "Hunger Broadcasts",
      value: profile.stats.hungerBroadcasts,
      color: "text-tertiary",
    },
    {
      icon: Award,
      label: "Impact Score",
      value: profile.stats.impactScore,
      color: "text-status-available",
    },
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <main className="container max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account and view your impact</p>
          </div>

          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">{new Date(profile.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/my-posts")}>
                  View My Posts
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/my-requests")}>
                  View My Requests
                </Button>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
