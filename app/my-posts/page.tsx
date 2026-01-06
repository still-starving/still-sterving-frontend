"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, Clock, MapPin, Trash2, Users, Flame, CookingPot } from "lucide-react"
import { SpiceLevel } from "@/types/messaging"
import { formatRelativeTime } from "@/lib/utils"

interface FoodPost {
  id: string
  title: string
  status: "available" | "requested" | "taken"
  expiryDate: string
  location: string
  requestCount: number
  imageUrls?: string[]
  spiceLevel?: SpiceLevel
  ingredients?: string
  cookedAt?: string
}

interface HungerBroadcast {
  id: string
  message: string
  timePosted: string
  status: "active" | "expired"
  location: string
  offerCount: number
}

export default function MyPostsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [foodPosts, setFoodPosts] = useState<FoodPost[]>([])
  const [hungerBroadcasts, setHungerBroadcasts] = useState<HungerBroadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [resolveLoading, setResolveLoading] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await api.getMyPosts() as any

      console.log('📦 My Posts - Response:', response)

      // Backend returns an object with foodPosts and hungerBroadcasts
      const foodArray = Array.isArray(response?.foodPosts) ? response.foodPosts : []
      const hungerArray = Array.isArray(response?.hungerBroadcasts) ? response.hungerBroadcasts : []

      console.log('📊 Food array length:', foodArray.length)
      console.log('📊 Hunger array length:', hungerArray.length)

      // Log request counts for each post
      foodArray.forEach((post: any, index: number) => {
        console.log(`Post ${index + 1}: "${post.title}" - requestCount:`, post.requestCount)
      })

      setFoodPosts(foodArray)
      setHungerBroadcasts(hungerArray)
    } catch (error) {
      console.error('❌ Error loading posts:', error)
      toast({
        variant: "destructive",
        title: "Failed to load posts",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
      // Set empty arrays on error
      setFoodPosts([])
      setHungerBroadcasts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteHunger = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return

    setDeleteLoading(id)
    try {
      await api.deleteHungerBroadcast(id)
      toast({
        title: "Broadcast deleted",
        description: "Your hunger broadcast has been removed.",
      })
      fetchData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleResolveHunger = async (id: string) => {
    setResolveLoading(id)
    try {
      await api.resolveHungerBroadcast(id)
      toast({
        title: "Broadcast resolved",
        description: "Your hunger broadcast has been marked as resolved.",
      })
      fetchData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resolve",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setResolveLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
      case "active":
        return "bg-status-available/20 text-status-available border-status-available/30"
      case "requested":
        return "bg-status-requested/20 text-status-requested border-status-requested/30"
      case "taken":
      case "expired":
      case "resolved":
        return "bg-status-taken/20 text-status-taken border-status-taken/30"
      default:
        return ""
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <main className="container max-w-3xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">My Posts</h1>
            <p className="text-muted-foreground mt-1">Manage your food posts and hunger broadcasts</p>
          </div>

          <Tabs defaultValue="food" className="space-y-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="food">Food Posts</TabsTrigger>
              <TabsTrigger value="hunger">Hunger Broadcasts</TabsTrigger>
            </TabsList>

            <TabsContent value="food">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (foodPosts ?? []).length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <p className="text-lg text-muted-foreground mb-2">You haven't posted any food yet.</p>
                    <p className="text-sm text-muted-foreground">Share your leftover food to help others!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(foodPosts ?? []).map((post) => (
                    <Card
                      key={post.id}
                      className={
                        post.requestCount > 0
                          ? "border-orange-500/50 hover:border-orange-500 transition-colors bg-orange-500/5"
                          : "border-border/50 hover:border-primary/30 transition-colors"
                      }
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-semibold flex-1 text-balance">{post.title}</h3>
                          <div className="flex gap-2">
                            {post.requestCount > 0 && (
                              <Badge className="bg-orange-500 text-white animate-pulse">
                                {post.requestCount} {post.requestCount === 1 ? 'Request' : 'Requests'}
                              </Badge>
                            )}
                            <Badge className={getStatusColor(post.status)}>{post.status.toUpperCase()}</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Expires {formatRelativeTime(post.expiryDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{post.requestCount} requests</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{post.location}</span>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => router.push(`/food/${post.id}`)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hunger">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (hungerBroadcasts ?? []).length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <p className="text-lg text-muted-foreground mb-2">You haven't broadcast hunger yet.</p>
                    <p className="text-sm text-muted-foreground">Let others know when you need help!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(hungerBroadcasts ?? []).map((broadcast) => (
                    <Card key={broadcast.id} className="border-border/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base flex-1">{broadcast.message}</p>
                          <Badge className={getStatusColor(broadcast.status)}>{broadcast.status.toUpperCase()}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Posted {formatRelativeTime(broadcast.timePosted)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{broadcast.offerCount} offers</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{broadcast.location}</span>
                        </div>

                        {broadcast.status === "active" && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-hover"
                              onClick={() => handleResolveHunger(broadcast.id)}
                              disabled={resolveLoading === broadcast.id || deleteLoading === broadcast.id}
                            >
                              {resolveLoading === broadcast.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Resolving...
                                </>
                              ) : (
                                "Mark Resolved"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 text-destructive hover:bg-destructive/10 bg-transparent"
                              onClick={() => handleDeleteHunger(broadcast.id)}
                              disabled={deleteLoading === broadcast.id || resolveLoading === broadcast.id}
                            >
                              {deleteLoading === broadcast.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
