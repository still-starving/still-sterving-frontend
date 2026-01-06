"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, ArrowLeft, MapPin, Clock, Utensils, User, Trash2, CheckCircle, XCircle, Flame, CookingPot, ChefHat } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useWebSocket } from "@/hooks/use-websocket"
import { SpiceLevel } from "@/types/messaging"
import { formatReadableDate, formatRelativeTime, formatMonthYear } from "@/lib/utils"

interface FoodPost {
  id: string
  title: string
  description: string
  quantity: string
  location: string
  expiryDate: string
  status: string
  ownerName: string
  ownerId: string
  ownerJoinDate: string
  isOwner: boolean
  imageUrls?: string[]
  spiceLevel: SpiceLevel
  ingredients: string
  cookedAt?: string
}

interface Request {
  id: string
  userName: string
  requestDate: string
  status: string
}

export default function FoodDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { lastMessage } = useWebSocket()
  const [post, setPost] = useState<FoodPost | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const rawPost = (await api.getFoodPost(params.id as string)) as any
      console.log('📦 Food post raw data:', rawPost)

      // Normalize data to handle backend inconsistencies
      const postData: FoodPost = {
        ...rawPost,
        ownerName: rawPost.ownerName || rawPost.userName || rawPost.user?.name || rawPost.author?.name || "Unknown Foodie",
        ownerId: rawPost.ownerId || rawPost.userId || rawPost.user?.id || rawPost.author?.id,
        ownerJoinDate: rawPost.ownerJoinDate || rawPost.user?.joinDate || rawPost.author?.joinDate || rawPost.joinDate,
      }

      setPost(postData)

      if (postData.isOwner) {
        const requestsData = (await api.getFoodRequests(params.id as string)) as Request[]
        console.log('📋 Requests data:', requestsData)
        console.log('Is owner:', postData.isOwner, 'Requests count:', requestsData.length)
        setRequests(requestsData)
      } else {
        console.log('❌ Not owner, skipping requests fetch')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load food post",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
      router.push("/feed")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  // Listen for new request notifications (for food owners)
  useEffect(() => {
    if (!lastMessage || !post) return

    console.log('🔔 Food detail page received message:', lastMessage.type, lastMessage)

    if (lastMessage.type === "request_created" && "foodRequest" in lastMessage) {
      const { foodRequest } = lastMessage
      console.log('✅ Request created event:', foodRequest)
      console.log('Current post ID:', params.id, 'Request post ID:', foodRequest.foodPostId, 'Is owner:', post.isOwner)

      // Only show notification if this is for the current post
      if (foodRequest.foodPostId === params.id && post.isOwner) {
        console.log('🎉 Showing notification for owner!')
        toast({
          title: "New request!",
          description: `${foodRequest.userName || "Someone"} wants your ${post.title}!`,
        })
        // Refresh requests list
        fetchData()
      } else {
        console.log('❌ Not showing notification:', {
          postMatch: foodRequest.foodPostId === params.id,
          isOwner: post.isOwner
        })
      }
    }
  }, [lastMessage, post, params.id])

  const handleDelete = async () => {
    setActionLoading("delete")
    try {
      await api.deleteFoodPost(params.id as string)
      toast({
        title: "Post deleted",
        description: "Your food post has been removed.",
      })
      router.push("/feed")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
      setActionLoading(null) // Only reset if failed, otherwise we redirect
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await api.acceptRequest(params.id as string, requestId) as any

      // Extract conversationId from response
      const conversationId = response?.conversationId || response?.conversation?.id

      if (conversationId) {
        toast({
          title: "Request accepted",
          description: "Opening chat to coordinate pickup...",
        })
        // Navigate to the conversation
        router.push(`/messages/${conversationId}`)
      } else {
        toast({
          title: "Request accepted",
          description: "The requester will be notified.",
        })
        fetchData()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to accept",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      await api.rejectRequest(params.id as string, requestId)
      toast({
        title: "Request rejected",
        description: "The requester will be notified.",
      })
      fetchData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to reject",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setActionLoading(null)
    }
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

  if (!post) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-status-available/20 text-status-available border-status-available/30"
      case "requested":
        return "bg-status-requested/20 text-status-requested border-status-requested/30"
      case "taken":
        return "bg-status-taken/20 text-status-taken border-status-taken/30"
      default:
        return ""
    }
  }

  const getSpiceInfo = (level: SpiceLevel = "no_spicy") => {
    switch (level) {
      case "no_spicy":
        return { label: "No Spice", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", emoji: "🌱" }
      case "medium_spicy":
        return { label: "Medium Spicy", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", emoji: "🌶️" }
      case "spicy":
        return { label: "Spicy", color: "bg-red-500/10 text-red-500 border-red-500/20", emoji: "🔥" }
      case "very_spicy":
        return { label: "Very Spicy", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", emoji: "💥" }
      default:
        return { label: "No Spice", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", emoji: "🌱" }
    }
  }

  const getFreshnessInfo = (cookedAt?: string) => {
    if (!cookedAt) return null

    const now = new Date()
    const cooked = new Date(cookedAt)
    const diffMs = now.getTime() - cooked.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffMins = Math.floor(diffMs / (1000 * 60))

    let label = ""
    let color = ""

    if (diffHours < 2) {
      label = diffMins < 60 ? `Freshly prepared (${diffMins}m ago)` : "Freshly prepared (1h ago)"
      color = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    } else if (diffHours < 6) {
      label = `Prepared ${Math.floor(diffHours)}h ago`
      color = "bg-amber-500/10 text-amber-500 border-amber-500/20"
    } else if (diffHours < 24) {
      label = `Prepared ${Math.floor(diffHours)}h ago`
      color = "bg-slate-500/10 text-slate-400 border-slate-500/20"
    } else {
      label = "Prepared yesterday"
      color = "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }

    return { label, color }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <main className="container max-w-3xl mx-auto px-4 py-6">
          <Link href="/feed">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </Link>

          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Utensils className="h-3 w-3" />
                      FOOD AVAILABLE
                    </Badge>
                    <Badge className={getStatusColor(post.status)}>{post.status.toUpperCase()}</Badge>
                    <Badge variant="outline" className={`${getSpiceInfo(post.spiceLevel).color} border`}>
                      {getSpiceInfo(post.spiceLevel).emoji} {getSpiceInfo(post.spiceLevel).label.toUpperCase()}
                    </Badge>
                    {post.cookedAt && getFreshnessInfo(post.cookedAt) && (
                      <Badge variant="outline" className={`${getFreshnessInfo(post.cookedAt)?.color} border`}>
                        <ChefHat className="h-3 w-3 mr-1" />
                        {getFreshnessInfo(post.cookedAt)?.label.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                </div>
                {post.isOwner && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 bg-transparent"
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "delete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Owner Info - Prominent */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background shadow-inner">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg leading-none">{post.ownerName}</p>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium bg-primary/10 text-primary border-none">
                      OWNER
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sharing since {formatMonthYear(post.ownerJoinDate)}
                  </p>
                </div>
                {!post.isOwner && (
                  <Button
                    size="sm"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 glow-hover shadow-md px-4"
                    onClick={() => router.push(`/messages?ownerId=${post.ownerId}&postId=${post.id}`)}
                  >
                    Message
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-base leading-relaxed">{post.description}</p>
              </div>

              {post.ingredients && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <CookingPot className="h-4 w-4" />
                    Ingredients & Allergens
                  </h3>
                  <p className="text-base leading-relaxed italic text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                    {post.ingredients}
                  </p>
                </div>
              )}

              {post.imageUrls && post.imageUrls.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Images</h3>
                    <div className={`grid gap-3 ${post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.imageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                          <img
                            src={url}
                            alt={`${post.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <Utensils className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{post.quantity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Location</p>
                    <p className="font-medium">{post.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-tertiary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="font-medium">{formatReadableDate(post.expiryDate)} ({formatRelativeTime(post.expiryDate)})</p>
                  </div>
                </div>

                {post.cookedAt && (
                  <div className="flex items-center gap-3">
                    <ChefHat className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prepared At</p>
                      <p className="font-medium">{formatReadableDate(post.cookedAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />



              {post.isOwner && (requests ?? []).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Requests ({(requests ?? []).length})</h3>
                    <div className="space-y-3">
                      {(requests ?? []).map((request) => (
                        <Card key={request.id} className="bg-muted/50 border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">{request.userName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(request.requestDate).toLocaleString()}
                                </p>
                              </div>
                              {request.status === "pending" ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-status-available/10 text-status-available border-status-available/30 hover:bg-status-available/20"
                                    onClick={() => handleAcceptRequest(request.id)}
                                    disabled={!!actionLoading}
                                  >
                                    {actionLoading === request.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Accept
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10 bg-transparent"
                                    onClick={() => handleRejectRequest(request.id)}
                                    disabled={!!actionLoading}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <Badge className={request.status === "accepted" ? getStatusColor("available") : ""}>
                                  {request.status.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Food Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">"{post.title}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={!!actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!actionLoading}>
              {actionLoading === "delete" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Post"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
