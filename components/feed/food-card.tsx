"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Map, Clock, User, Utensils, Play, MessageCircle, Flame, Leaf, CookingPot, ChefHat } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import Image from "next/image"
import { MapModal } from "@/components/ui/map-modal"
import { SpiceLevel } from "@/types/messaging"
import { formatReadableDate, formatRelativeTime, getFreshnessLevel } from "@/lib/utils"
import { getAuthToken } from "@/lib/api"
import { calculateDistance } from "@/lib/geo" // Import geo util

interface FoodCardProps {
  post: {
    id: string
    title: string
    description: string
    quantity: string
    location: string
    latitude?: number // Add optional lat/lng
    longitude?: number
    expiryDate: string
    status: "available" | "requested" | "taken"
    ownerName: string
    ownerId: string
    imageUrls?: string[]
    isOwner?: boolean
    price?: number
    spiceLevel?: SpiceLevel
    ingredients?: string
    cookedAt?: string
  }
  onUpdate?: () => void
  userLocation?: { lat: number; lng: number } // Add userLocation prop
}

export function FoodCard({ post, onUpdate, userLocation }: FoodCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)


  // Calculate distance if coordinates are available
  const distance = (userLocation && post.latitude && post.longitude)
    ? calculateDistance(userLocation.lat, userLocation.lng, post.latitude, post.longitude)
    : null
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const isExpired = new Date(post.expiryDate) <= new Date()
  const isTaken = post.status === "taken"
  const isInactive = isExpired || isTaken

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500 text-white"
      case "requested":
        return "bg-amber-500 text-white"
      case "taken":
        return "bg-slate-500 text-white"
      default:
        return ""
    }
  }

  const getSpiceInfo = (level: SpiceLevel = "no_spicy") => {
    switch (level) {
      case "no_spicy":
        return { label: "Mild", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30", emoji: "🌱" }
      case "medium_spicy":
        return { label: "Medium", color: "bg-amber-500/20 text-amber-500 border-amber-500/30", emoji: "🌶️" }
      case "spicy":
        return { label: "Spicy", color: "bg-red-500/20 text-red-500 border-red-500/30", emoji: "🔥" }
      case "very_spicy":
        return { label: "Very Spicy", color: "bg-purple-600/20 text-purple-400 border-purple-500/30", emoji: "💥" }
      default:
        return { label: "Mild", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", emoji: "🌱" }
    }
  }

  // ... (inside FoodCard)

  const handleRequest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Join the Community!",
        description: "Please login to request food and start sharing with neighbors.",
      })
      router.push(`/login?returnUrl=/feed`)
      return
    }

    setIsRequesting(true)
    try {
      await api.requestFood(post.id)
      toast({
        title: "Request Sent!",
        description: `We've notified ${post.ownerName}. You can see your requests in the "My Requests" tab.`,
      })
      onUpdate?.()
    } catch (error: any) {
      let description = error.message || "Something went wrong."

      if (error.status === 409) {
        description = "You have already requested this item or it's no longer available for request."
      }

      toast({
        variant: "destructive",
        title: "Couldn't send request",
        description,
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Hang on!",
        description: "Please sign in to send a message and coordinate with others.",
      })
      router.push(`/login?returnUrl=/feed`)
      return
    }

    try {
      const conversation = await api.createConversation({
        foodPostId: post.id,
        otherParticipantId: post.ownerId,
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

  // Prepare images array with fallback
  const images = (post.imageUrls && post.imageUrls.length > 0)
    ? post.imageUrls
    : [`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80`]

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div
      className="group relative transition-all duration-300 ease-out cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/food/${post.id}`)}
    >
      {/* Main Card */}
      <div className={`
        relative rounded-lg overflow-hidden bg-black
        transition-all duration-300 ease-out origin-center
        ${isHovered ? 'scale-110 z-50 shadow-2xl shadow-black/60' : 'scale-100'}
      `}>
        {/* Image Section */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageError ? `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80` : images[currentImageIndex]}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
            priority
          />

          {/* Base Gradient - Always visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Enhanced Gradient on Hover */}
          <div className={`
            absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `} />

          {/* Status Badge - Top Right */}
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            {(!post.price || post.price === 0) ? (
              <Badge className="bg-emerald-500 text-white font-bold text-xs px-2 py-1 shadow-lg border-none">
                FREE
              </Badge>
            ) : (
              <Badge className="bg-white text-black font-bold text-xs px-2 py-1 shadow-lg border-none">
                €{post.price}
              </Badge>
            )}
            <Badge className={`${getStatusColor(post.status)} font-semibold text-xs px-2 py-1`}>
              {post.status.toUpperCase()}
            </Badge>
            {post.spiceLevel && (
              <Badge className={`${getSpiceInfo(post.spiceLevel).color} font-bold text-[10px] px-1.5 py-0.5 border`}>
                {getSpiceInfo(post.spiceLevel).emoji} {getSpiceInfo(post.spiceLevel).label.toUpperCase()}
              </Badge>
            )}
          </div>

          {/* Image Navigation - Only show if multiple images and hovered */}
          {images.length > 1 && isHovered && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 backdrop-blur-sm transition-all z-20"
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 backdrop-blur-sm transition-all z-20"
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}

          {/* Title - Always visible at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className="text-lg font-bold text-white drop-shadow-2xl line-clamp-2">
              {post.title}
            </h3>
            {post.cookedAt && (
              <div className={`flex items-center gap-1 text-[10px] font-bold drop-shadow-lg mt-0.5 ${getFreshnessLevel(post.cookedAt).color}`}>
                <ChefHat className="h-3 w-3" />
                {`${getFreshnessLevel(post.cookedAt).label}: ${formatRelativeTime(post.cookedAt)}`.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details Section - Slides in on hover */}
        <div className={`
          bg-gradient-to-b from-zinc-900 to-black
          transition-all duration-300 ease-out overflow-hidden
          ${isHovered ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-4 space-y-3">
            {/* Description */}
            <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {post.description}
            </p>

            {/* Quick Info Row */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-emerald-400" />
                <span>{post.quantity}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className={isExpired ? "text-red-400" : ""}>
                  {isExpired ? "Expired" : `Expires ${formatRelativeTime(post.expiryDate)}`}
                </span>
              </div>
            </div>

            {/* Ingredients */}
            {post.ingredients && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <CookingPot className="h-3 w-3 text-emerald-400" />
                  Ingredients
                </div>
                <p className="text-xs text-gray-300 line-clamp-2 italic leading-relaxed">
                  {post.ingredients}
                </p>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                <span className="truncate max-w-[150px]">{post.location}</span>
                {distance !== null && (
                  <Badge variant="secondary" className="ml-2 h-5 text-[10px] px-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20">
                    {distance} km away
                  </Badge>
                )}
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

            {/* Posted By */}
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-800">
              <User className="h-3 w-3" />
              <span>
                by <span className="text-gray-300 font-medium">{post.ownerName}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {post.isOwner ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 bg-muted/30 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50 text-white border-white/20 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/food/${post.id}`)
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              ) : !isInactive ? (
                <>
                  {post.status === "available" ? (
                    <Button
                      size="sm"
                      className="flex-1 bg-white hover:bg-gray-200 text-black h-9 text-xs font-semibold"
                      onClick={handleRequest}
                      disabled={isRequesting}
                    >
                      {isRequesting ? "Requesting..." : "Request Food"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-gray-800 text-gray-400 border-gray-700 h-9 text-xs"
                      disabled
                    >
                      Requested
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 bg-muted/30 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50 text-white border-white/20 text-xs"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                </>
              ) : (
                <div className="flex-1 py-2 text-center text-xs text-muted-foreground bg-muted/10 rounded-md border border-border/20">
                  This item is no longer available
                </div>
              )}
            </div>

            {/* Dot Indicators - Show if multiple images */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1 pt-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(index)
                    }}
                    className={`h-1 rounded-full transition-all ${index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-gray-600 w-1 hover:bg-gray-500'
                      }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
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
        userLocation={userLocation}
        title={post.title}
      />
    </div>
  )
}
