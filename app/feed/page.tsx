"use client"

import { useEffect, useState, useCallback } from "react"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { FoodCard } from "@/components/feed/food-card"
import { HungerCard } from "@/components/feed/hunger-card"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import type { FoodFeedItem, HungerFeedItem } from "@/types/messaging"

type FeedItem = FoodFeedItem | HungerFeedItem

export default function FeedPage() {
  const { toast } = useToast()
  const { lastMessage } = useWebSocket()
  const [allFeed, setAllFeed] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const availableFoodScrollRef = useRef<HTMLDivElement>(null)
  const hungerScrollRef = useRef<HTMLDivElement>(null)
  const expiredFoodScrollRef = useRef<HTMLDivElement>(null)

  const fetchFeed = async () => {
    setIsLoading(true)
    try {
      const data = await api.getFeed("all")
      setAllFeed(data as FeedItem[])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load feed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle real-time WebSocket feed updates
  const handleFeedBroadcast = useCallback((newItem: FeedItem) => {
    setAllFeed((currentFeed) => {
      // Check if item already exists to avoid duplicates
      const exists = currentFeed.some((item) => item.id === newItem.id)
      if (exists) {
        return currentFeed
      }
      // Prepend new item to the top of the feed
      return [newItem, ...currentFeed]
    })
  }, [])

  useEffect(() => {
    fetchFeed()
  }, [])

  // Listen for WebSocket broadcast messages
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === "food_post" && "foodPost" in lastMessage) {
      handleFeedBroadcast(lastMessage.foodPost)
    } else if (lastMessage.type === "hunger_broadcast" && "hungerBroadcast" in lastMessage) {
      handleFeedBroadcast(lastMessage.hungerBroadcast)
    } else if (lastMessage.type === "hunger_broadcast_expired") {
      const expiredId = (lastMessage as any).content
      setAllFeed((currentFeed) => currentFeed.filter(item => item.id !== expiredId))
    }
  }, [lastMessage, handleFeedBroadcast])

  // Separate food items into available and expired
  const allFoodItems = (allFeed ?? []).filter((item) => item.type === "food") as FoodFeedItem[]
  const availableFoodItems = allFoodItems.filter((item) => {
    const expiryDate = new Date(item.expiryDate)
    const now = new Date()
    return expiryDate > now && (item.status === "available" || item.status === "requested")
  })
  const expiredFoodItems = allFoodItems.filter((item) => {
    const expiryDate = new Date(item.expiryDate)
    const now = new Date()
    return expiryDate <= now || item.status === "taken"
  })
  const hungerItems = (allFeed ?? []).filter((item) => item.type === "hunger") as HungerFeedItem[]

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 400
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <main className="w-full py-8 space-y-12">
          {/* Hero Section */}
          <div className="container max-w-7xl mx-auto px-4 md:px-6">
            <div className="mb-8 space-y-3">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Share food. <span className="text-primary">Kill hunger.</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl">Help your community, one meal at a time</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Row 1: Available Food */}
              {availableFoodItems.length > 0 && (
                <div className="space-y-4">
                  <div className="container max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">Available Food</h2>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(availableFoodScrollRef, "left")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(availableFoodScrollRef, "right")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div
                      ref={availableFoodScrollRef}
                      className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-6 py-8"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {availableFoodItems.map((item, index) => (
                        <div key={`available-food-${item.id}-${index}`} className="flex-none w-[320px] md:w-[380px]">
                          <FoodCard post={item} onUpdate={fetchFeed} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 2: People in Need */}
              {hungerItems.length > 0 && (
                <div className="space-y-4">
                  <div className="container max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">People in Need</h2>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(hungerScrollRef, "left")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(hungerScrollRef, "right")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div
                      ref={hungerScrollRef}
                      className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-6 py-8"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {hungerItems.map((item, index) => (
                        <div key={`hunger-${item.id}-${index}`} className="flex-none w-[320px] md:w-[380px]">
                          <HungerCard post={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 3: Expired Food */}
              {expiredFoodItems.length > 0 && (
                <div className="space-y-4">
                  <div className="container max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl md:text-3xl font-bold text-muted-foreground">Expired / Taken Food</h2>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(expiredFoodScrollRef, "left")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(expiredFoodScrollRef, "right")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div
                      ref={expiredFoodScrollRef}
                      className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-6 py-8 opacity-60"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {expiredFoodItems.map((item, index) => (
                        <div key={`expired-food-${item.id}-${index}`} className="flex-none w-[320px] md:w-[380px]">
                          <FoodCard post={item} onUpdate={fetchFeed} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {availableFoodItems.length === 0 && hungerItems.length === 0 && expiredFoodItems.length === 0 && (
                <div className="container max-w-7xl mx-auto px-4 md:px-6">
                  <div className="text-center py-16 space-y-3">
                    <p className="text-lg text-muted-foreground">No posts yet.</p>
                    <p className="text-sm text-muted-foreground">Be the first to help someone.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
