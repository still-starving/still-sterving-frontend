"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Badge } from "@/components/ui/badge"
import { FeedbackModal } from "@/components/feed/feedback-modal"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, MapPin, User, Calendar, MessageCircle, ChevronRight, Utensils, Info, Star } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

interface Request {
  id: string
  foodPostId: string
  postTitle: string  // Backend uses postTitle, not foodTitle
  postOwnerName: string  // Backend uses postOwnerName, not foodOwnerName
  postOwnerId?: string
  createdAt: string  // Backend uses createdAt, not requestDate
  status: "pending" | "accepted" | "rejected"
  pickupLocation?: string
  message?: string
  conversationId?: string
  claimedByUserId?: string
  rating?: number
}

export default function MyRequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { lastMessage } = useWebSocket()
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [feedbackPost, setFeedbackPost] = useState<{ id: string, title: string } | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = (await api.getMyRequests()) as Request[]
        console.log('📋 My Requests data from backend:', data)

        // Log each request's status and conversationId
        data.forEach((req, index) => {
          console.log(`Request ${index + 1}: status="${req.status}", conversationId="${req.conversationId || 'MISSING'}"`, req)
        })

        setRequests(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Couldn't load your requests",
          description: "We're having trouble showing your request history. Please refresh the page.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const markAsViewed = async () => {
      try {
        await api.markMyRequestsAsViewed()
      } catch (error) {
        // Silently fail
      }
    }

    const fetchProfile = async () => {
      try {
        const data = await api.getMe() as any
        const uid = data?.id || data?.uuid || data?.sub || data?.userId || data?.ID || data?.UID
        console.log('🆔 currentUserId from getMe (Requests):', uid)
        if (uid) setCurrentUserId(uid)
      } catch (error) {
        console.error("User fetch failed:", error)
      }
    }

    fetchRequests()
    markAsViewed()
    fetchProfile()
  }, [])

  // Listen for request status updates (for requesters)
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === "request_updated" && "foodRequest" in lastMessage) {
      const { foodRequest, conversationId } = lastMessage as any

      // Update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === foodRequest.id
            ? { ...req, status: foodRequest.status, conversationId: foodRequest.conversationId }
            : req
        )
      )

      // Show appropriate toast notification
      if (foodRequest.status === "accepted") {
        const finalConversationId = conversationId || foodRequest.conversationId
        toast({
          title: "Good news!",
          description: `Your request for ${foodRequest.foodTitle || foodRequest.postTitle || "food"} was ACCEPTED! Click to chat.`,
          action: finalConversationId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/messages/${finalConversationId}`)}
            >
              Open Chat
            </Button>
          ) : undefined,
        })
      } else if (foodRequest.status === "rejected") {
        toast({
          variant: "destructive",
          title: "Offer Declined",
          description: `Your request for ${foodRequest.foodTitle || "this item"} was not accepted at this time.`,
        })
      }
    }
  }, [lastMessage, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-status-requested/20 text-status-requested border-status-requested/30"
      case "accepted":
        return "bg-status-available/20 text-status-available border-status-available/30"
      case "rejected":
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
              <h1 className="text-4xl font-extrabold tracking-tight text-white">My Requests</h1>
            </div>
            <p className="text-muted-foreground text-lg ml-4">Stay updated on your food request status</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Loader2 className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
          ) : (requests ?? []).length === 0 ? (
            <Card className="bg-card/40 backdrop-blur-md border-white/5 overflow-hidden">
              <CardContent className="p-16 text-center space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                  <Utensils className="h-10 w-10 text-zinc-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">No food requests yet</p>
                  <p className="text-zinc-500 max-w-xs mx-auto">Hungry? Check the live feed to see what's being shared in your community!</p>
                </div>
                <Button onClick={() => router.push('/feed')} className="rounded-full px-8">Browse Feed</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(requests ?? []).map((request) => (
                <Card
                  key={request.id}
                  className={`
                    group relative overflow-hidden transition-all duration-300 ease-out border-white/10
                    bg-card/40 backdrop-blur-md hover:bg-card/60 hover:border-white/20
                    hover:scale-[1.01] hover:shadow-xl
                    ${request.status === "accepted" ? "ring-1 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : ""}
                  `}
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
                    {/* Visual Element */}
                    <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-zinc-900 items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                      {request.status === "accepted" ? (
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                      ) : request.status === "rejected" ? (
                        <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-red-500" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{request.postTitle}</h3>
                          <p className="text-sm text-zinc-500 flex items-center gap-1.5 font-medium">
                            <User className="h-3.5 w-3.5 text-primary" />
                            {request.postOwnerName}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2.5 text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{formatRelativeTime(request.createdAt)}</span>
                        </div>

                        {request.status === "accepted" ? (
                          request.pickupLocation ? (
                            <div className="flex items-center gap-2.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{request.pickupLocation}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="truncate">Ready for pickup!</span>
                            </div>
                          )
                        ) : request.status === "rejected" ? (
                          <div className="flex items-center gap-2.5 text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10">
                            <Info className="h-3.5 w-3.5" />
                            <span className="truncate">Request declined</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Info className="h-3.5 w-3.5 text-zinc-500 rotate-180" />
                            <span className="truncate">Waiting for response</span>
                          </div>
                        )}
                      </div>

                      {request.message && (
                        <div className="relative p-4 bg-zinc-900/50 rounded-xl border border-white/5 group-hover:bg-zinc-900/80 transition-colors">
                          <p className="text-sm text-zinc-400 italic line-clamp-2">"{request.message}"</p>
                          <div className="absolute -top-2 -left-2 h-5 w-5 bg-card/60 rounded-full flex items-center justify-center border border-white/5">
                            <Info className="h-2.5 w-2.5 text-primary" />
                          </div>
                        </div>
                      )}

                      {request.status === "accepted" && request.conversationId && (
                        <div className="pt-2">
                          <Link href={`/messages/${request.conversationId}`} className="block w-full">
                            <Button
                              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 hover:glow-emerald rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 group/btn"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Open Conversation
                              <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </Link>
                        </div>
                      )}

                      {request.status === "accepted" && (!request.rating || request.rating === 0) && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10 rounded-xl font-bold gap-2"
                            onClick={() => {
                              console.log('🔍 Raw request data for feedback:', JSON.stringify(request, null, 2))
                              const targetPostId = request.foodPostId || (request as any).postId || (request as any).food_post_id
                              console.log('📝 Opening feedback for:', {
                                targetPostId,
                                currentUserId,
                                status: request.status
                              })
                              if (!targetPostId) {
                                console.error('❌ Missing foodPostId in request:', request)
                                toast({
                                  variant: "destructive",
                                  title: "Couldn't open feedback",
                                  description: "We're missing the post information. Please try again later.",
                                })
                                return
                              }
                              setFeedbackPost({ id: targetPostId, title: request.postTitle })
                            }}
                          >
                            <Star className="h-4 w-4" />
                            Leave Feedback
                          </Button>
                        </div>
                      )}

                      {request.rating && request.rating > 0 && (
                        <div className="pt-2 flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">
                            <Star className="h-3 w-3 mr-1 fill-amber-500" />
                            FEEDBACK SUBMITTED ({request.rating})
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <BottomNav />

        <FeedbackModal
          isOpen={!!feedbackPost}
          onClose={() => setFeedbackPost(null)}
          postId={feedbackPost?.id || ""}
          postTitle={feedbackPost?.title || ""}
          onSuccess={() => {
            // Refresh requests to update rating status
            api.getMyRequests().then((data: any) => setRequests(data))
          }}
        />
      </div>
    </AuthGuard>
  )
}
