"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MapPin, Clock, User, Utensils } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import Image from "next/image"
import { MapModal } from "@/components/ui/map-modal"

interface FoodCardProps {
  post: {
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
  onUpdate?: () => void
}

export function FoodCard({ post, onUpdate }: FoodCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "requested":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "taken":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
      default:
        return ""
    }
  }

  const getTimeRemaining = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diff = expiry.getTime() - now.getTime()

    if (diff < 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours < 24) {
      return `${hours}h ${minutes}m left`
    }

    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h left`
  }

  const handleRequest = async () => {
    setIsRequesting(true)
    try {
      await api.requestFood(post.id)
      toast({
        title: "Request sent!",
        description: "The food owner will be notified of your request.",
      })
      onUpdate?.()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  // Generate a placeholder image based on food title
  const placeholderImage = post.imageUrl || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80`

  return (
    <Card className="group overflow-hidden border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/50 backdrop-blur-sm">
      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
        <Image
          src={placeholderImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(post.status)} backdrop-blur-md font-semibold`}>
            {post.status.toUpperCase()}
          </Badge>
        </div>

        {/* Title Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
            {post.title}
          </h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {post.description}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Utensils className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <span className="font-medium text-foreground">{post.quantity}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tertiary/10">
              <Clock className="h-4 w-4 text-tertiary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Expires</span>
              <span className={`font-medium ${getTimeRemaining(post.expiryDate).includes("Expired") ? "text-destructive" : "text-foreground"}`}>
                {getTimeRemaining(post.expiryDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center justify-between gap-2 text-sm p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-secondary flex-shrink-0" />
            <span className="font-medium text-foreground">{post.location}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-secondary/20 hover:text-secondary"
            onClick={(e) => {
              e.stopPropagation()
              setIsMapOpen(true)
            }}
          >
            View Map
          </Button>
        </div>

        {/* Map Modal */}
        <MapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          location={post.location}
          title={post.title}
        />

        {/* Posted By */}
        <div className="flex items-center gap-2 text-sm pt-2 border-t border-border/50">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-muted-foreground">
            Posted by <span className="font-medium text-foreground">{post.ownerName}</span>
          </span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {post.isOwner ? (
            <Button
              variant="outline"
              className="w-full bg-transparent hover:bg-primary/5"
              onClick={() => router.push(`/food/${post.id}`)}
            >
              View Details
            </Button>
          ) : post.status === "available" ? (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
              onClick={handleRequest}
              disabled={isRequesting}
            >
              {isRequesting ? "Requesting..." : "Request Food"}
            </Button>
          ) : (
            <Button variant="outline" className="w-full bg-transparent" disabled>
              {post.status === "taken" ? "No Longer Available" : "Already Requested"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
