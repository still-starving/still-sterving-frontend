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
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateFoodPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    location: "",
    expiryDate: "",
    expiryTime: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Food title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (formData.description.length > 280) newErrors.description = "Description must be 280 characters or less"
    if (!formData.quantity.trim()) newErrors.quantity = "Quantity is required"
    if (!formData.location.trim()) newErrors.location = "Pickup location is required"
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required"
    if (!formData.expiryTime) newErrors.expiryTime = "Expiry time is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const expiryDateTime = new Date(`${formData.expiryDate}T${formData.expiryTime}`)
      await api.createFoodPost({
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        location: formData.location,
        expiryDate: expiryDateTime.toISOString(),
      })

      toast({
        title: "Food posted!",
        description: "Your food is now available for others to request.",
      })
      router.push("/feed")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to post food",
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
              <CardTitle className="text-2xl">Share Food</CardTitle>
              <CardDescription>Help someone by sharing your leftover food</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Food Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Leftover Pizza, Pasta, etc."
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      setErrors({ ...errors, title: "" })
                    }}
                    aria-invalid={!!errors.title}
                    disabled={isLoading}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description *{" "}
                    <span className="text-muted-foreground text-xs">({formData.description.length}/280)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the food, any dietary information, etc."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value })
                      setErrors({ ...errors, description: "" })
                    }}
                    maxLength={280}
                    rows={4}
                    aria-invalid={!!errors.description}
                    disabled={isLoading}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    placeholder="e.g., 2 portions, 4 slices, etc."
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value })
                      setErrors({ ...errors, quantity: "" })
                    }}
                    aria-invalid={!!errors.quantity}
                    disabled={isLoading}
                  />
                  {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Pickup Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Library, Dorm Building A, etc."
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        setFormData({ ...formData, expiryDate: e.target.value })
                        setErrors({ ...errors, expiryDate: "" })
                      }}
                      aria-invalid={!!errors.expiryDate}
                      disabled={isLoading}
                    />
                    {errors.expiryDate && <p className="text-sm text-destructive">{errors.expiryDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryTime">Expiry Time *</Label>
                    <Input
                      id="expiryTime"
                      type="time"
                      value={formData.expiryTime}
                      onChange={(e) => {
                        setFormData({ ...formData, expiryTime: e.target.value })
                        setErrors({ ...errors, expiryTime: "" })
                      }}
                      aria-invalid={!!errors.expiryTime}
                      disabled={isLoading}
                    />
                    {errors.expiryTime && <p className="text-sm text-destructive">{errors.expiryTime}</p>}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-hover"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Food"
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
