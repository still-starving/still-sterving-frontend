"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MapPin, Clock, User, Flame } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MapModal } from "@/components/ui/map-modal"

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
  const [isMapOpen, setIsMapOpen] = useState(false)

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
    <Card className="group overflow-hidden border-border/40 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/5 bg-card/50 backdrop-blur-sm">
      {/* Gradient Header */}
      <div className={`relative p-6 ${post.urgency === "urgent" ? "bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20" : "bg-gradient-to-br from-secondary/20 via-secondary/10 to-tertiary/20"}`}>
        {/* Urgency Badge */}
        {post.urgency === "urgent" && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-500/30 text-red-300 border-red-500/50 backdrop-blur-md font-semibold animate-pulse">
              <Flame className="h-3 w-3 mr-1" />
              URGENT
            </Badge>
          </div>
        )}

        {/* Message */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/30 backdrop-blur-sm">
              <Flame className="h-5 w-5 text-secondary" />
            </div>
            <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/40 backdrop-blur-sm">
              HUNGRY
            </Badge>
          </div>

          <p className="text-base text-foreground leading-relaxed font-medium">
            {post.message}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-4">
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
              <MapPin className="h-4 w-4 text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Location</span>
              <span className="font-medium text-foreground">{post.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tertiary/10">
              <Clock className="h-4 w-4 text-tertiary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Posted</span>
              <span className="font-medium text-foreground">{getTimeAgo(post.timePosted)}</span>
            </div>
          </div>
        </div>

        {/* Map Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 bg-muted/30 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50"
          onClick={(e) => {
            e.stopPropagation()
            setIsMapOpen(true)
          }}
        >
          <MapPin className="h-4 w-4 mr-2" />
          View Location on Map
        </Button>

        {/* Map Modal */}
        <MapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          location={post.location}
          title={`Help ${post.userName}`}
        />

        {/* Posted By */}
        <div className="flex items-center gap-2 text-sm pt-2 border-t border-border/50">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20">
            <User className="h-3 w-3 text-secondary" />
          </div>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{post.userName}</span> needs help
          </span>
        </div>

        {/* Action Button */}
        {!post.isOwner && (
          <div className="pt-2">
            <Button
              className="w-full bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 shadow-lg shadow-secondary/25 transition-all duration-300"
              onClick={() => router.push("/create-food")}
            >
              Offer Food
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
