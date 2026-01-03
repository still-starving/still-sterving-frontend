"use client"

import { useEffect, useState } from "react"
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

type FoodFeedItem = {
  type: "food"
  id: string
  title: string
  description: string
  quantity: string
  location: string
  expiryDate: string
  status: "available" | "requested" | "taken"
  ownerName: string
  imageUrl?: string
  isOwner?: boolean
}

type HungerFeedItem = {
  type: "hunger"
  id: string
  message: string
  location: string
  urgency: "normal" | "urgent"
  userName: string
  timePosted: string
  isOwner?: boolean
}

type FeedItem = FoodFeedItem | HungerFeedItem

export default function FeedPage() {
  const { toast } = useToast()
  const [allFeed, setAllFeed] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const foodScrollRef = useRef<HTMLDivElement>(null)
  const hungerScrollRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    fetchFeed()
  }, [])

  const foodItems = (allFeed ?? []).filter((item) => item.type === "food") as FoodFeedItem[]
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
              {/* Food Available Section */}
              {foodItems.length > 0 && (
                <div className="space-y-4">
                  <div className="container max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">Food Available</h2>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(foodScrollRef, "left")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => scroll(foodScrollRef, "right")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div
                      ref={foodScrollRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-6 pb-4"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {foodItems.map((item, index) => (
                        <div key={`food-${item.id}-${index}`} className="flex-none w-[320px] md:w-[380px]">
                          <FoodCard post={item} onUpdate={fetchFeed} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* People in Need Section */}
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
                      className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-6 pb-4"
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

              {/* Empty State */}
              {foodItems.length === 0 && hungerItems.length === 0 && (
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
