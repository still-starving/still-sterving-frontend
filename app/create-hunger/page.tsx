"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useGeolocation } from "@/hooks/use-geolocation"
import { api } from "@/lib/api"
import { Loader2, ArrowLeft, Flame, MapPin, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function CreateHungerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { latitude, longitude, error: geoError, loading: geoLoading, request: reloadLocation } = useGeolocation()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    message: "",
    location: "",
    urgency: "normal" as "normal" | "urgent",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.message.trim()) newErrors.message = "Message is required"
    if (formData.message.length > 140) newErrors.message = "Message must be 140 characters or less"
    if (!formData.location.trim()) newErrors.location = "Area is required"

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      newErrors.geo = "Valid GPS coordinates are required to broadcast"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        toast({
          variant: "destructive",
          title: "Location Missing",
          description: "We need your coordinates to let nearby neighbors know you need help.",
        })
        setIsLoading(false)
        return
      }

      await api.createHungerBroadcast({
        ...formData,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString())
      })

      toast({
        title: "Broadcast Sent!",
        description: "Your request for help is now visible to people in your area.",
      })
      router.push("/feed")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to broadcast",
        description: error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <TopNav />

        <main className="container max-w-2xl mx-auto px-4 py-6">
          <Link href="/feed">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </Link>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Broadcast Hunger</CardTitle>
              <CardDescription className="text-balance">
                Let others know you need food. Your broadcast will expire after 12 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message * <span className="text-muted-foreground text-xs">({formData.message.length}/140)</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell others why you need food..."
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value })
                      setErrors({ ...errors, message: "" })
                    }}
                    maxLength={140}
                    rows={4}
                    aria-invalid={!!errors.message}
                    disabled={isLoading}
                    className="resize-none"
                  />
                  {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Keep it concise and respectful. This is a judgment-free space.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Area only) *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., North Campus, Downtown, etc."
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value })
                      setErrors({ ...errors, location: "" })
                    }}
                    aria-invalid={!!errors.location}
                    disabled={isLoading}
                  />
                  {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                </div>

                <div className="space-y-3">
                  <Label>Urgency</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className={
                        formData.urgency === "normal"
                          ? "bg-secondary/20 text-secondary border-secondary/50"
                          : "bg-transparent"
                      }
                      onClick={() => setFormData({ ...formData, urgency: "normal" })}
                      disabled={isLoading}
                    >
                      Normal
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={
                        formData.urgency === "urgent"
                          ? "bg-status-urgent/20 text-status-urgent border-status-urgent/50"
                          : "bg-transparent"
                      }
                      onClick={() => setFormData({ ...formData, urgency: "urgent" })}
                      disabled={isLoading}
                    >
                      <Flame className="h-4 w-4 mr-2" />
                      Urgent
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Note:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Your broadcast will automatically expire after 12 hours</li>
                    <li>Only your first name and area will be visible to others</li>
                    <li>Use "Urgent" only if you need immediate help</li>
                  </ul>
                </div>

                {/* Location Status Section */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all duration-300",
                  (latitude && longitude)
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : geoError
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-zinc-500/5 border-white/5"
                )}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        (latitude && longitude) ? "bg-emerald-500/20 text-emerald-500" : geoError ? "bg-destructive/20 text-destructive" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {geoLoading ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (latitude && longitude) ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : geoError ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : (
                          <MapPin className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {(latitude && longitude) ? "Location Ready" : geoLoading ? "Acquiring GPS..." : geoError ? "Location Error" : "GPS Required"}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          {(latitude && longitude)
                            ? "Coordinates successfully captured"
                            : geoError
                              ? "Please enable permissions or check GPS"
                              : "Needed to verify your post area"}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={reloadLocation}
                      disabled={geoLoading}
                      className="h-8 rounded-full border-white/10 hover:bg-white/5 text-[10px] font-bold"
                    >
                      {geoLoading ? "Checking..." : (latitude && longitude) ? "Update" : "Retry"}
                    </Button>
                  </div>
                  {errors.geo && <p className="text-xs text-destructive mt-2 font-bold ml-1">{errors.geo}</p>}
                </div>

                <Button
                  type="submit"
                  className={cn(
                    "w-full h-12 rounded-xl font-bold transition-all shadow-lg",
                    (latitude && longitude) ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 glow-secondary" : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                  )}
                  disabled={isLoading || geoLoading || (!latitude || !longitude)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    "Broadcast Hunger"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  )
}
