"use client"

import { cn } from "@/lib/utils"
import type { Message } from "@/types/messaging"

interface MessageBubbleProps {
    message: Message
    isOwnMessage: boolean
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
    const formattedTime = new Date(message.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    })

    return (
        <div
            className={cn(
                "flex flex-col gap-1.5 max-w-[85%] sm:max-w-[70%] mb-5",
                isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
            )}
        >
            {!isOwnMessage && message.senderName && (
                <span className="text-[10px] font-bold text-zinc-500 px-1 uppercase tracking-wider">{message.senderName}</span>
            )}
            <div
                className={cn(
                    "relative px-4 py-2.5 shadow-md transition-all duration-300",
                    isOwnMessage
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-primary/10"
                        : "bg-white/5 border border-white/5 text-white rounded-2xl rounded-tl-none backdrop-blur-sm"
                )}
            >
                {(message.type === 'image' || message.metadata?.imageUrl) ? (
                    <div className="relative w-[280px] sm:w-[320px] h-48 sm:h-56 mb-2 rounded-xl overflow-hidden shadow-inner border border-white/10 bg-zinc-900 max-w-full">
                        <img
                            src={message.metadata.imageUrl}
                            alt="Shared image"
                            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                        />
                    </div>
                ) : message.type === 'price_offer' && message.metadata?.amount !== undefined ? (
                    <div className="flex flex-col gap-2 min-w-[160px] p-2 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Price Offer</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="text-3xl font-black tracking-tighter">€{message.metadata.amount.toFixed(2)}</div>
                        <p className="text-xs font-medium opacity-80 leading-relaxed">{message.content}</p>
                    </div>
                ) : (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
            </div>
            <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold text-zinc-600">{formattedTime}</span>
                {isOwnMessage && message.isRead && (
                    <div className="flex items-center gap-0.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Read</span>
                        <div className="h-1 w-1 rounded-full bg-primary shadow-glow" />
                    </div>
                )}
            </div>
        </div>
    )
}
