"use client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Utensils, MessageSquare } from "lucide-react"

interface CreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateModal({ open, onOpenChange }: CreateModalProps) {
  const router = useRouter()

  const handleChoice = (type: "food" | "hunger") => {
    onOpenChange(false)
    router.push(type === "food" ? "/create-food" : "/create-hunger")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What would you like to create?</DialogTitle>
          <DialogDescription>Choose whether to share food or broadcast that you're hungry.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={() => handleChoice("food")}
            className="h-20 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-hover"
          >
            <Utensils className="h-6 w-6" />
            <span>Share Food</span>
          </Button>
          <Button
            onClick={() => handleChoice("hunger")}
            variant="outline"
            className="h-20 flex-col gap-2 border-secondary text-secondary hover:bg-secondary/10"
          >
            <MessageSquare className="h-6 w-6" />
            <span>Broadcast Hunger</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
