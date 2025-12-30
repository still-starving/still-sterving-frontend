"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MapPin, Clock, User, Utensils } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

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
    isOwner?: boolean
  }
  onUpdate?: () => void
}

export function FoodCard({ post, onUpdate }: FoodCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)

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

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Utensils className="h-3 w-3" />
            FOOD AVAILABLE
          </Badge>
          <Badge className={getStatusColor(post.status)}>{post.status.toUpperCase()}</Badge>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground text-balance">{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Utensils className="h-4 w-4 text-secondary" />
            <span>{post.quantity}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-tertiary" />
            <span className={getTimeRemaining(post.expiryDate).includes("Expired") ? "text-destructive" : ""}>
              {getTimeRemaining(post.expiryDate)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-secondary" />
          <span className="font-medium">{post.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <User className="h-4 w-4" />
          <span>Posted by {post.ownerName}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {post.isOwner ? (
          <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push(`/food/${post.id}`)}>
            View Details
          </Button>
        ) : post.status === "available" ? (
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-hover"
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
      </CardFooter>
    </Card>
  )
}
