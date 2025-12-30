"use client"

import { useEffect, useState } from "react"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { FoodCard } from "@/components/feed/food-card"
import { HungerCard } from "@/components/feed/hunger-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

type FeedType = "all" | "food" | "hunger"

interface FeedItem {
  type: "food" | "hunger"
  data: any
}

export default function FeedPage() {
  const { toast } = useToast()
  const [feedType, setFeedType] = useState<FeedType>("all")
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFeed = async () => {
    setIsLoading(true)
    try {
      const data = await api.getFeed(feedType)
      setFeed(data as FeedItem[])
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
  }, [feedType])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <main className="container max-w-3xl mx-auto px-4 py-6">
          {/* Hero Section */}
          <div className="mb-6 text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Share food. <span className="text-primary">Kill hunger.</span>
            </h1>
            <p className="text-muted-foreground">Help your community, one meal at a time</p>
          </div>

          {/* Filters */}
          <Tabs value={feedType} onValueChange={(value) => setFeedType(value as FeedType)} className="mb-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="food">Food Available</TabsTrigger>
              <TabsTrigger value="hunger">Hungry</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Feed Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-lg text-muted-foreground">No posts yet.</p>
              <p className="text-sm text-muted-foreground">Be the first to help someone.</p>
            </div>
          ) : (
            <TabsContent value={feedType} className="space-y-4">
              {feed.map((item, index) =>
                item.type === "food" ? (
                  <FoodCard key={`food-${item.data.id}-${index}`} post={item.data} onUpdate={fetchFeed} />
                ) : (
                  <HungerCard key={`hunger-${item.data.id}-${index}`} post={item.data} />
                ),
              )}
            </TabsContent>
          )}
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
