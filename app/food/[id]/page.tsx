"use client"

import { useEffect, useState } from "react"
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
import { Loader2, ArrowLeft, MapPin, Clock, Utensils, User, Trash2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface FoodPost {
  id: string
  title: string
  description: string
  quantity: string
  location: string
  expiryDate: string
  status: string
  ownerName: string
  ownerJoinDate: string
  isOwner: boolean
  imageUrls?: string[]
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
  const [post, setPost] = useState<FoodPost | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const postData = (await api.getFoodPost(params.id as string)) as FoodPost
      setPost(postData)

      if (postData.isOwner) {
        const requestsData = (await api.getFoodRequests(params.id as string)) as Request[]
        setRequests(requestsData)
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this food post?")) return

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
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      await api.acceptRequest(params.id as string, requestId)
      toast({
        title: "Request accepted",
        description: "The requester will be notified.",
      })
      fetchData()
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
                  </div>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                </div>
                {post.isOwner && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 bg-transparent"
                    onClick={handleDelete}
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
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-base leading-relaxed">{post.description}</p>
              </div>

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
                    <p className="font-medium">{new Date(post.expiryDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Posted by</p>
                  <p className="font-medium">{post.ownerName}</p>
                  <p className="text-xs text-muted-foreground">
                    Member since {new Date(post.ownerJoinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

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
    </AuthGuard>
  )
}
