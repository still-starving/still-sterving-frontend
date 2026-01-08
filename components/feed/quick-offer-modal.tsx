import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Euro, Image as ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import imageCompression from "browser-image-compression"

interface QuickOfferModalProps {
    isOpen: boolean
    onClose: () => void
    recipientName: string
    recipientId: string
    hungerBroadcastId: string
}

export function QuickOfferModal({
    isOpen,
    onClose,
    recipientName,
    recipientId,
    hungerBroadcastId,
}: QuickOfferModalProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [message, setMessage] = useState("")
    const [price, setPrice] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!message.trim()) return

        setIsLoading(true)
        try {
            // 1. Create or get conversation
            const conversation = await api.createConversation({
                otherParticipantId: recipientId,
                hungerBroadcastId: hungerBroadcastId,
            })

            const conversationId = (conversation as any).id

            // 2. Prepare metadata
            let metadata: any = {}
            let type: 'text' | 'image' | 'price_offer' = 'text'
            let finalContent = message

            // Handle Image
            if (selectedFile) {
                type = 'image'
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true }
                const compressedFile = await imageCompression(selectedFile, options)

                // Convert to base64 for POC (real app would upload to S3)
                await new Promise<void>((resolve) => {
                    const reader = new FileReader()
                    reader.readAsDataURL(compressedFile)
                    reader.onloadend = () => {
                        metadata.imageUrl = reader.result as string
                        resolve()
                    }
                })
            }

            // Handle Price (Price takes precedence as "type" if both present, or we can mix. 
            // For simplicity, if price is set, we treat it as an offer, potentially with an image attachment)
            if (price && !isNaN(Number(price)) && Number(price) > 0) {
                type = 'price_offer'
                metadata.amount = Number(price)
                metadata.currency = 'EUR'
                metadata.status = 'pending'
                finalContent = message // The message text accompanies the offer

                // If there was an image, we might want to attach it to the offer metadata too
                // For now, let's keep it simple.
            }

            // 3. Send Message
            // We need to use the sendMessage endpoint. 
            // Since `api` helper might not expose it directly as a simple function, we'll assume we can call it.
            // If api.ts doesn't have sendMessage, we should add it or use raw fetch. 
            // Checking api.ts... it seems we don't have a direct sendMessage in the `api` object export yet.
            // We will add it or use a raw request here.

            // 3. Send Message
            const res = await api.sendMessage(conversationId, {
                content: finalContent,
                type: type,
                metadata: Object.keys(metadata).length ? metadata : undefined
            })

            // api.sendMessage throws on error, so we don't need to check res.ok here if using apiRequest wrapper
            // But if apiRequest returns JSON directly, we are good.

            toast({
                title: "Offer Sent!",
                description: `Your message has been sent to ${recipientName}. Check your messages for their reply!`,
            })

            onClose()
            router.push(`/messages/${conversationId}`)

        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send offer. Please try again.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Offer Help to {recipientName}</DialogTitle>
                    <DialogDescription>
                        Send a friendly message to coordinate. You can propose a price if it's a paid item.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Hey, I have some extra lasagna..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (Optional)</Label>
                            <div className="relative">
                                <Euro className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-8"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Image (Optional)</Label>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                {selectedFile ? "Change" : "Attach"}
                            </Button>
                        </div>
                    </div>
                    {selectedFile && (
                        <div className="text-xs text-muted-foreground truncate">
                            Selected: {selectedFile.name}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!message.trim() || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Offer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
