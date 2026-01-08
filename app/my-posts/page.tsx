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
import { Loader2, Clock, MapPin, Trash2, Users, Flame, CookingPot, CheckCircle, ChevronRight, Calendar, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [broadcastToDelete, setBroadcastToDelete] = useState<HungerBroadcast | null>(null)

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
        title: "We couldn't load your posts",
        description: "There was a problem retrieving your contributions. Please try again in a bit.",
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

  const handleDeleteHunger = async () => {
    if (!broadcastToDelete) return

    setDeleteLoading(broadcastToDelete.id)
    try {
      await api.deleteHungerBroadcast(broadcastToDelete.id)
      toast({
        title: "Broadcast deleted",
        description: "Your hunger broadcast has been removed.",
      })
      setIsDeleteModalOpen(false)
      setBroadcastToDelete(null)
      fetchData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't remove broadcast",
        description: "We encountered an error while trying to remove your broadcast. Please try again.",
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
        title: "Couldn't mark as resolved",
        description: "We had trouble updating your broadcast. Please try again.",
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

        <main className="container max-w-3xl mx-auto px-4 py-8">
          <div className="mb-8 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 pt-1 bg-primary rounded-full" />
              <h1 className="text-4xl font-extrabold tracking-tight text-white">My Posts</h1>
            </div>
            <p className="text-muted-foreground text-lg ml-4">Track and manage your community contributions</p>
          </div>

          <Tabs defaultValue="food" className="space-y-6">
            <TabsList className="w-full h-12 p-1 bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl">
              <TabsTrigger
                value="food"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-primary transition-all duration-300"
              >
                Food Shares
              </TabsTrigger>
              <TabsTrigger
                value="hunger"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:glow-primary transition-all duration-300"
              >
                Hunger Broadcasts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="food">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Loader2 className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                </div>
              ) : (foodPosts ?? []).length === 0 ? (
                <Card className="bg-card/40 backdrop-blur-md border-white/5 overflow-hidden">
                  <CardContent className="p-16 text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                      <CookingPot className="h-10 w-10 text-zinc-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-white">No food shares yet</p>
                      <p className="text-zinc-500 max-w-xs mx-auto">Your contributions help the community. Start by sharing some leftover food!</p>
                    </div>
                    <Button onClick={() => router.push('/create-food')} className="rounded-full px-8">Share Food</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {(foodPosts ?? []).map((post) => (
                    <Card
                      key={post.id}
                      className={`
                        group relative overflow-hidden transition-all duration-300 ease-out border-white/10
                        ${post.requestCount > 0
                          ? "bg-orange-500/5 ring-1 ring-orange-500/30 hover:ring-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                          : "bg-card/40 backdrop-blur-md hover:bg-card/60 hover:border-white/20"}
                        hover:scale-[1.01] hover:shadow-xl
                      `}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Card Image */}
                          <div className="relative w-full sm:w-40 h-40 flex-shrink-0 bg-zinc-900 border-r border-white/5">
                            {post.imageUrls && post.imageUrls[0] ? (
                              <img
                                src={post.imageUrls[0]}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                <CookingPot className="h-10 w-10 text-zinc-700" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-2 left-2">
                              <Badge className={`${getStatusColor(post.status)} text-[10px] font-bold px-1.5 py-0`}>
                                {post.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          {/* Card Info */}
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{post.title}</h3>
                                {post.requestCount > 0 && (
                                  <Badge className="bg-orange-500 text-white animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                                    {post.requestCount}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-primary" />
                                  <span className="truncate">Expires {formatRelativeTime(post.expiryDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-primary" />
                                  <span className="truncate">{post.location}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-3">
                              <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                {post.requestCount} active requests
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-white hover:bg-primary transition-all rounded-full group/btn"
                                onClick={() => router.push(`/food/${post.id}`)}
                              >
                                Manage
                                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hunger">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : (hungerBroadcasts ?? []).length === 0 ? (
                <Card className="bg-card/40 backdrop-blur-md border-white/5 overflow-hidden">
                  <CardContent className="p-16 text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                      <Users className="h-10 w-10 text-zinc-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-white">No active broadcasts</p>
                      <p className="text-zinc-500 max-w-xs mx-auto">Need help? Don't hesitate to broadcast your needs to the community.</p>
                    </div>
                    <Button onClick={() => router.push('/create-hunger')} variant="outline" className="rounded-full px-8 bg-transparent">Broadcast Hunger</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {(hungerBroadcasts ?? []).map((broadcast) => (
                    <Card
                      key={broadcast.id}
                      className={`
                        group relative overflow-hidden transition-all duration-300 ease-out border-white/10
                        ${broadcast.offerCount > 0
                          ? "bg-teal-500/5 ring-1 ring-teal-500/30 hover:ring-teal-500/50"
                          : "bg-card/40 backdrop-blur-md hover:bg-card/60 hover:border-white/20"}
                        hover:scale-[1.01] hover:shadow-xl
                      `}
                    >
                      <CardContent className="p-5 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-lg font-medium text-white line-clamp-2 leading-relaxed">{broadcast.message}</p>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatRelativeTime(broadcast.timePosted)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {broadcast.offerCount} offers
                              </span>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(broadcast.status)} text-[10px] font-bold px-2 self-start`}>
                            {broadcast.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="line-clamp-1">{broadcast.location}</span>
                        </div>

                        {broadcast.status === "active" && (
                          <div className="flex gap-3 pt-2">
                            <Button
                              variant="default"
                              className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 hover:glow-primary rounded-xl transition-all"
                              onClick={() => handleResolveHunger(broadcast.id)}
                              disabled={resolveLoading === broadcast.id || deleteLoading === broadcast.id}
                            >
                              {resolveLoading === broadcast.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Mark Resolved
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 bg-transparent rounded-xl transition-all"
                              onClick={() => {
                                setBroadcastToDelete(broadcast);
                                setIsDeleteModalOpen(true);
                              }}
                              disabled={deleteLoading === broadcast.id || resolveLoading === broadcast.id}
                            >
                              {deleteLoading === broadcast.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hunger Broadcast</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your broadcast? <span className="font-medium text-foreground italic">"{broadcastToDelete?.message}"</span> This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={!!deleteLoading} className="bg-transparent">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteHunger} disabled={!!deleteLoading}>
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Broadcast"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
