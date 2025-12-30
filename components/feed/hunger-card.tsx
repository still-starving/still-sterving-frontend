"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MapPin, Clock, User, MessageSquare, Flame } from "lucide-react"
import { useRouter } from "next/navigation"

interface HungerCardProps {
  post: {
    id: string
    message: string
    location: string
    urgency: "normal" | "urgent"
    userName: string
    timePosted: string
    isOwner?: boolean
  }
}

export function HungerCard({ post }: HungerCardProps) {
  const router = useRouter()

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diff = now.getTime() - posted.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Card className="overflow-hidden border-border/50 hover:border-secondary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
            <MessageSquare className="h-3 w-3" />
            HUNGRY
          </Badge>
          {post.urgency === "urgent" && (
            <Badge className="bg-status-urgent/20 text-status-urgent border-status-urgent/30 pulse-urgent">
              <Flame className="h-3 w-3" />
              URGENT
            </Badge>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-base text-foreground leading-relaxed">{post.message}</p>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-secondary" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{getTimeAgo(post.timePosted)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <User className="h-4 w-4" />
          <span>{post.userName}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {!post.isOwner && (
          <Button
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={() => router.push("/create-food")}
          >
            Offer Food
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
