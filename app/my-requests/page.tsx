"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2, MapPin, User, Calendar, MessageCircle } from "lucide-react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

interface Request {
  id: string
  postTitle: string  // Backend uses postTitle, not foodTitle
  postOwnerName: string  // Backend uses postOwnerName, not foodOwnerName
  postOwnerId?: string
  createdAt: string  // Backend uses createdAt, not requestDate
  status: "pending" | "accepted" | "rejected"
  pickupLocation?: string
  message?: string
  conversationId?: string
}

export default function MyRequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { lastMessage } = useWebSocket()
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
          title: "Failed to load requests",
          description: error instanceof Error ? error.message : "Something went wrong.",
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

    fetchRequests()
    markAsViewed()
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
          title: "Request declined",
          description: `Your request for ${foodRequest.foodTitle || "food"} was declined.`,
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

        <main className="container max-w-3xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
            <p className="text-muted-foreground mt-1">Track your food requests</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (requests ?? []).length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <p className="text-lg text-muted-foreground mb-2">You haven't requested any food yet.</p>
                <p className="text-sm text-muted-foreground">Check the feed for available food!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(requests ?? []).map((request) => (
                <Card key={request.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold flex-1 text-balance">{request.postTitle}</h3>
                      <Badge className={getStatusColor(request.status)}>{request.status.toUpperCase()}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Food owner: {request.postOwnerName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Requested {formatRelativeTime(request.createdAt)}</span>
                      </div>

                      {request.status === "accepted" && request.pickupLocation && (
                        <div className="flex items-center gap-2 text-status-available font-medium">
                          <MapPin className="h-4 w-4" />
                          <span>Pickup: {request.pickupLocation}</span>
                        </div>
                      )}

                      {request.status === "accepted" && request.conversationId && (
                        <Link href={`/messages/${request.conversationId}`}>
                          <Button size="sm" variant="outline" className="mt-2 w-full">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            View Chat
                          </Button>
                        </Link>
                      )}

                      {request.message && (
                        <div className="p-3 bg-muted/50 rounded-md mt-2">
                          <p className="text-sm italic">{request.message}</p>
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
      </div>
    </AuthGuard>
  )
}
