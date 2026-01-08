"use client"

import type React from "react"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Loader2, ArrowLeft, Banknote, CreditCard, Wallet, Flame, ChefHat, MapPin, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SpiceLevel } from "@/types/messaging"
import Link from "next/link"
import imageCompression from "browser-image-compression"
import { useGeolocation } from "@/hooks/use-geolocation"
import { cn } from "@/lib/utils"

// Image upload constraints
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per image
const MAX_TOTAL_SIZE = 15 * 1024 * 1024 // 15MB total
const MAX_IMAGES = 5
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function CreateFoodPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateFoodForm />
    </Suspense>
  )
}

function CreateFoodForm() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const hungerBroadcastId = searchParams.get('hungerBroadcastId')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaid, setIsPaid] = useState(false)

  // Geolocation
  const { latitude, longitude, error: geoError, loading: geoLoading, request: reloadLocation } = useGeolocation()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: "",
    price: "0",
    paymentMethod: "cash",
    location: "",
    expiryDate: new Date().toISOString().split('T')[0],
    expiryTime: new Date().toTimeString().slice(0, 5),
    spiceLevel: "no_spicy" as SpiceLevel,
    ingredients: "",
    cookedDate: new Date().toISOString().split('T')[0],
    cookedTime: new Date().toTimeString().slice(0, 5),
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Food title is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (formData.description.length > 280) newErrors.description = "Description must be 280 characters or less"
    if (!formData.quantity.trim()) newErrors.quantity = "Quantity is required"
    if (isPaid && (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
      newErrors.price = "Please enter a valid price greater than 0"
    }
    if (!formData.location.trim()) newErrors.location = "Pickup location is required"
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required"
    if (!formData.expiryTime) newErrors.expiryTime = "Expiry time is required"

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      newErrors.geo = "Valid GPS coordinates are required to post food"
    }

    if (formData.cookedDate && formData.cookedTime) {
      const cookedDateTime = new Date(`${formData.cookedDate}T${formData.cookedTime}`)
      if (cookedDateTime > new Date()) {
        newErrors.cookedTime = "Cooked time cannot be in the future"
      }
    } else {
      newErrors.cookedTime = "Cooked time is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Check number of files
    if (files.length > MAX_IMAGES) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_IMAGES} images.`,
      })
      return
    }

    // Validate file formats
    const invalidFiles = files.filter(f => !ALLOWED_FORMATS.includes(f.type))
    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Only JPEG, PNG, and WebP images are allowed.",
      })
      return
    }

    // Check individual file sizes
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Each image must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Please compress or resize your images.`,
      })
      return
    }

    // Check total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      toast({
        variant: "destructive",
        title: "Total size too large",
        description: `Total size must be less than ${MAX_TOTAL_SIZE / 1024 / 1024}MB. Current: ${(totalSize / 1024 / 1024).toFixed(1)}MB`,
      })
      return
    }

    // Compress images
    setIsCompressing(true)
    try {
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
      }

      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const compressed = await imageCompression(file, compressionOptions)
            return new File([compressed], file.name, { type: 'image/jpeg' })
          } catch (error) {
            console.error('Compression failed for', file.name, error)
            return file // Return original if compression fails
          }
        })
      )

      setSelectedFiles(compressedFiles)

      // Generate previews
      const previews = compressedFiles.map(file => URL.createObjectURL(file))
      setImagePreviews(previews)

      toast({
        title: "Images Ready!",
        description: `${compressedFiles.length} photo(s) optimized and ready to share.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Compression failed",
        description: "Failed to process images. Please try again.",
      })
    } finally {
      setIsCompressing(false)
    }
  }

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const expiryDateTime = new Date(`${formData.expiryDate}T${formData.expiryTime}`)

      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('quantity', formData.quantity)
      formDataToSend.append('price', formData.price)
      if (isPaid) {
        formDataToSend.append('paymentMethod', formData.paymentMethod)
      }

      // If linked to hunger broadcast, include it in metadata (backend support pending)
      if (hungerBroadcastId) {
        formDataToSend.append('hungerBroadcastId', hungerBroadcastId)
      }

      formDataToSend.append('location', formData.location)
      formDataToSend.append('expiryDate', expiryDateTime.toISOString())

      const cookedAt = new Date(`${formData.cookedDate}T${formData.cookedTime}`)
      formDataToSend.append('cookedAt', cookedAt.toISOString())

      formDataToSend.append('spiceLevel', formData.spiceLevel)
      formDataToSend.append('ingredients', formData.ingredients)

      // Append coordinates if available
      if (latitude && longitude && latitude !== 0 && longitude !== 0) {
        formDataToSend.append('latitude', latitude.toString())
        formDataToSend.append('longitude', longitude.toString())
      } else {
        toast({
          variant: "destructive",
          title: "Where are you?",
          description: "We need your location to show your post to nearby neighbors.",
        })
        setIsLoading(false)
        return
      }

      // Append all image files
      selectedFiles.forEach(file => {
        formDataToSend.append('images', file)
      })

      await api.createFoodPost(formDataToSend)

      toast({
        title: "Food Shared Successfully!",
        description: "Thank you for helping reduce waste! Neighbors nearby can now see your contribution.",
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

                <div className="space-y-4">
                  <Label>Spice Level *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'no_spicy', label: 'No Spicy', emoji: '🌱' },
                      { id: 'medium_spicy', label: 'Medium', emoji: '🌶️' },
                      { id: 'spicy', label: 'Spicy', emoji: '🔥' },
                      { id: 'very_spicy', label: 'Very Spicy', emoji: '💥' },
                    ].map((level) => (
                      <Button
                        key={level.id}
                        type="button"
                        variant={formData.spiceLevel === level.id ? "default" : "outline"}
                        className={`h-12 flex flex-col items-center justify-center gap-1 ${formData.spiceLevel === level.id ? "border-2 border-primary" : ""}`}
                        onClick={() => setFormData({ ...formData, spiceLevel: level.id as SpiceLevel })}
                      >
                        <span className="text-lg">{level.emoji}</span>
                        <span className="text-[10px] font-semibold uppercase">{level.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingredients">
                    Main Ingredients <span className="text-muted-foreground text-xs">(Optional, max 1000 • {formData.ingredients.length}/1000)</span>
                  </Label>
                  <Textarea
                    id="ingredients"
                    placeholder="List major ingredients and allergens (e.g., nuts, dairy, soy)"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    maxLength={1000}
                    rows={3}
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-muted-foreground">Listing common allergens helps make the community safer.</p>
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

                <div className="space-y-3">
                  <Label>How do you want to share? *</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!isPaid ? "default" : "outline"}
                      className={`flex-1 h-12 ${!isPaid ? "border-2 border-primary" : ""}`}
                      onClick={() => {
                        setIsPaid(false)
                        setFormData({ ...formData, price: "0" })
                        setErrors({ ...errors, price: "" })
                      }}
                    >
                      Free
                    </Button>
                    <Button
                      type="button"
                      variant={isPaid ? "default" : "outline"}
                      className={`flex-1 h-12 ${isPaid ? "border-2 border-primary" : ""}`}
                      onClick={() => {
                        setIsPaid(true)
                        if (formData.price === "0") {
                          setFormData({ ...formData, price: "" })
                        }
                      }}
                    >
                      Paid
                    </Button>
                  </div>
                </div>

                {isPaid && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="price">Price (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="e.g., 2.00"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        setErrors({ ...errors, price: "" })
                      }}
                      aria-invalid={!!errors.price}
                      disabled={isLoading}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                  </div>
                )}

                {isPaid && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Label>Payment Method *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        className={`
                          relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer bg-card/50
                          ${formData.paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}
                        `}
                        onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                      >
                        <div className={`p-2 rounded-lg ${formData.paymentMethod === 'cash' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <Banknote className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold">Cash</p>
                          <p className="text-xs text-muted-foreground font-medium">Pay in person</p>
                        </div>
                        {formData.paymentMethod === 'cash' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>

                      <div className="relative flex items-center p-4 rounded-xl border-2 border-border/40 bg-muted/30 opacity-60 cursor-not-allowed">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">Online Payment</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">Coming soon</p>
                        </div>
                        <Badge variant="outline" className="absolute top-2 right-2 text-[10px] px-1.5 py-0">Soon</Badge>
                      </div>
                    </div>
                  </div>
                )}

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

                <div className="space-y-2">
                  <Label htmlFor="images">
                    Images <span className="text-muted-foreground text-xs">(Optional, max 5 • JPEG, PNG, WebP)</span>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    disabled={isLoading || isCompressing}
                    className="cursor-pointer"
                  />
                  {isCompressing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Compressing images...</span>
                    </div>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            disabled={isLoading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="space-y-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="h-4 w-4 text-orange-500" />
                    <Label className="text-orange-500 font-semibold uppercase tracking-wider text-xs">Freshness Tracking</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cookedDate">When was it cooked? *</Label>
                      <Input
                        id="cookedDate"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.cookedDate}
                        onChange={(e) => {
                          setFormData({ ...formData, cookedDate: e.target.value })
                          setErrors({ ...errors, cookedTime: "" })
                        }}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cookedTime">Time *</Label>
                      <Input
                        id="cookedTime"
                        type="time"
                        value={formData.cookedTime}
                        onChange={(e) => {
                          setFormData({ ...formData, cookedTime: e.target.value })
                          setErrors({ ...errors, cookedTime: "" })
                        }}
                        aria-invalid={!!errors.cookedTime}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  {errors.cookedTime && <p className="text-xs text-destructive">{errors.cookedTime}</p>}
                  <p className="text-[10px] text-muted-foreground italic">Providing accurate cooking time helps others know the food is fresh.</p>
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
                    (latitude && longitude) ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                  )}
                  disabled={isLoading || geoLoading || (!latitude || !longitude)}
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
