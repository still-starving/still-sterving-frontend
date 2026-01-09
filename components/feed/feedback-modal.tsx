"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    postId: string
    postTitle: string
    onSuccess?: () => void
}

export function FeedbackModal({ isOpen, onClose, postId, postTitle, onSuccess }: FeedbackModalProps) {
    console.log('🖼️ FeedbackModal state:', { isOpen, postId, postTitle })
    const [rating, setRating] = useState<number>(0)
    const [review, setReview] = useState<string>("")
    const [hoveredRating, setHoveredRating] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async () => {
        if (rating === 0 || !postId) {
            toast({
                variant: "destructive",
                title: "Feedback Error",
                description: "We couldn't identify the food post. Please refresh the page and try again.",
            })
            return
        }

        setIsLoading(true)
        console.log('🚀 Submitting feedback:', { postId, rating, review })
        try {
            await api.submitFeedback(postId, { rating, review })
            toast({
                title: "Thank you for your feedback!",
                description: "Your review helps maintain a helpful and safe community.",
            })
            onSuccess?.()
            onClose()
            // Reset form
            setRating(0)
            setReview("")
        } catch (error: any) {
            console.error('❌ Feedback submission failed:', error)
            if (error.status === 403) {
                console.group('🚫 403 Forbidden Debug Info')
                console.log('Post ID:', postId)
                console.log('Error Data:', error.data)
                console.groupEnd()
            }
            toast({
                variant: "destructive",
                title: "Couldn't submit feedback",
                description: error instanceof Error ? error.message : "Something went wrong.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate your food from {postTitle}</DialogTitle>
                    <DialogDescription>
                        How was the food you received? Your feedback helps donors know their impact.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Rating</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-zinc-600"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm font-medium text-amber-500 animate-in fade-in slide-in-from-top-1">
                                {rating === 1 && "Not great"}
                                {rating === 2 && "Okay"}
                                {rating === 3 && "Good"}
                                {rating === 4 && "Great!"}
                                {rating === 5 && "Delicious!"}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="review" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Review (Required)
                        </label>
                        <Textarea
                            id="review"
                            placeholder="Tell your neighbor what you liked! Was it tasty? Was the handoff easy?"
                            value={review}
                            onChange={(e) => setReview(e.target.value.substring(0, 500))}
                            className="resize-none h-24 bg-zinc-900 border-zinc-800"
                            required
                        />
                        <p className="text-[10px] text-right text-zinc-500">
                            {review.length}/500 characters
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="bg-transparent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={rating === 0 || !review.trim() || isLoading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 glow-hover"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Feedback"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
