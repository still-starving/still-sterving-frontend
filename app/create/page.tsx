"use client"

import { useState, useEffect } from "react"
import { CreateModal } from "@/components/layout/create-modal"

export default function CreatePage() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  return <CreateModal open={open} onOpenChange={setOpen} />
}
