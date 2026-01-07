"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MapPin, Map, Clock, User, Flame } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils"
import { useState } from "react"
import { MapModal } from "@/components/ui/map-modal"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle } from "lucide-react"
import { getAuthToken } from "@/lib/api"


interface HungerCardProps {
  post: {
    id: string
    message: string
    location: string
    urgency: "normal" | "urgent"
    userName: string
    ownerId: string
    timePosted: string
    isOwner?: boolean
    latitude?: number
    longitude?: number
  }
}

export function HungerCard({ post }: HungerCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isMapOpen, setIsMapOpen] = useState(false)

  // ... (inside HungerCard)

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please login to help.",
      })
      router.push(`/login?returnUrl=/feed`)
      return
    }

    try {
      // Record the offer on the backend
      await api.offerFood(post.id)

      // Start the conversation linked to this broadcast
      const conversation = await api.createConversation({
        otherParticipantId: post.ownerId,
        hungerBroadcastId: post.id,
      })
      router.push(`/messages/${(conversation as any).id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    }
  }



  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative transition-all duration-300 ease-out cursor-default"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card */}
      <div className={`
        relative rounded-lg overflow-hidden bg-black
        transition-all duration-300 ease-out origin-center
        ${isHovered ? 'scale-110 z-50 shadow-2xl shadow-black/60' : 'scale-100'}
      `}>
        {/* Image Section (Placeholder with Icon) */}
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900 flex items-center justify-center">
          {/* Background Pattern/Icon */}
          <div className={`absolute inset-0 bg-gradient-to-br ${post.urgency === "urgent" ? "from-orange-900/40 via-red-900/20 to-black" : "from-emerald-900/40 via-teal-900/20 to-black"}`} />
          <Flame className={`h-24 w-24 ${post.urgency === "urgent" ? "text-orange-500/20" : "text-emerald-500/20"} transition-transform duration-700 group-hover:scale-110`} />

          {/* Base Gradient - Always visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Enhanced Gradient on Hover */}
          <div className={`
            absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `} />

          {/* Status Badge - Top Right */}
          <div className="absolute top-3 right-3 z-10">
            {post.urgency === "urgent" ? (
              <Badge className="bg-red-500 text-white font-semibold text-xs px-2 py-1 animate-pulse border-red-600">
                <Flame className="h-3 w-3 mr-1" />
                URGENT
              </Badge>
            ) : (
              <Badge className="bg-emerald-500 text-white font-semibold text-xs px-2 py-1 border-emerald-600">
                HUNGRY
              </Badge>
            )}
          </div>

          {/* Message - Always visible at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className="text-lg font-bold text-white drop-shadow-2xl line-clamp-2">
              "{post.message}"
            </h3>
          </div>
        </div>

        {/* Expanded Details Section - Slides in on hover */}
        <div className={`
          bg-gradient-to-b from-zinc-900 to-black
          transition-all duration-300 ease-out overflow-hidden
          ${isHovered ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-4 space-y-3">
            {/* Quick Info Row */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-gray-300">{post.userName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{formatRelativeTime(post.timePosted)}</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-secondary flex-shrink-0" />
                <span className="text-xs truncate">{post.location}</span>
              </div>
              <button
                className="p-1.5 rounded-full bg-zinc-800/50 text-secondary hover:bg-secondary/10 hover:text-secondary hover:scale-110 transition-all border border-zinc-700/50"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMapOpen(true)
                }}
                title="View on Map"
              >
                <Map className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 bg-muted/30 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50 text-white border-white/20 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMapOpen(true)
                }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Location
              </Button>

              {!post.isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 bg-muted/30 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50 text-white border-white/20 text-xs"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Offer Help
                  </Button>

                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        location={post.location}
        latitude={post.latitude}
        longitude={post.longitude}
        title={`Help ${post.userName}`}
      />
    </div>
  )
}
