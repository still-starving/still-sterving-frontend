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
import { api } from "@/lib/api"
import { Loader2, ArrowLeft, Flame } from "lucide-react"
import Link from "next/link"

export default function CreateHungerPage() {
  const router = useRouter()
  const { toast } = useToast()
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
    if (!formData.location.trim()) newErrors.location = "Location is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      await api.createHungerBroadcast(formData)

      toast({
        title: "Broadcast sent!",
        description: "Others in your area will see your hunger broadcast.",
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

                <Button
                  type="submit"
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isLoading}
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
