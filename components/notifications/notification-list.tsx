"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell, Check, Heart, Users, Trash2, Clock, MapPin } from "lucide-react"
import type { Notification } from "@/types/messaging"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"

interface NotificationListProps {
    onUnreadCountChange: (count: number) => void
    onClose?: () => void
}

export function NotificationList({ onUnreadCountChange, onClose }: NotificationListProps) {
    const { toast } = useToast()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const data = await api.getNotifications()
            const notificationsArray = Array.isArray(data) ? data : []
            setNotifications(notificationsArray)

            const unreadCount = notificationsArray.filter(n => !n.isRead).length
            onUnreadCountChange(unreadCount)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
            setNotifications([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.markNotificationAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            )
            const newUnreadCount = notifications.filter(n => n.id !== id && !n.isRead).length
            onUnreadCountChange(newUnreadCount)
        } catch (error) {
            console.error("Failed to mark notification as read:", error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'broadcast_closed':
                return <Heart className="h-4 w-4 text-pink-500" />
            case 'request_created':
                return <Users className="h-4 w-4 text-blue-500" />
            case 'request_updated':
                return <Check className="h-4 w-4 text-emerald-500" />
            default:
                return <Bell className="h-4 w-4 text-primary" />
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="py-12 text-center bg-zinc-900/50">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                        <Bell className="h-8 w-8 text-zinc-600" />
                    </div>
                </div>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">All caught up!</p>
                <p className="text-xs text-zinc-600 mt-1">No new notifications for now.</p>
            </div>
        )
    }

    return (
        <div className="max-h-[500px] flex flex-col bg-zinc-950/50 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm text-white uppercase tracking-wider">Notifications</h4>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] uppercase tracking-wider font-bold"
                        onClick={async () => {
                            // Ideally there's a mark all as read endpoint, but for now we'll do it sequentially or skip
                        }}
                    >
                        Mark all as read
                    </Button>
                )}
            </div>
            <div className="overflow-y-auto p-2 space-y-1">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`
                            px-4 py-4 rounded-xl transition-all duration-300 cursor-pointer 
                            ${!notification.isRead
                                ? 'bg-primary/10 hover:bg-primary/15 border border-primary/20 shadow-lg shadow-primary/5'
                                : 'hover:bg-white/5 border border-transparent hover:border-white/5'}
                        `}
                        onClick={() => {
                            if (!notification.isRead) handleMarkAsRead(notification.id)
                            if (onClose) onClose()
                            // Navigate if referenceId exists?
                        }}
                    >
                        <div className="flex gap-3">
                            <div className="mt-1 flex-shrink-0">
                                <div className="p-2 rounded-full bg-muted">
                                    {getIcon(notification.type)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {!notification.isRead && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(255,159,28,0.8)]" />
                                        )}
                                        <p className={`text-sm font-bold leading-none truncate ${!notification.isRead ? 'text-white' : 'text-zinc-300'}`}>
                                            {notification.title}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap uppercase tracking-tighter">
                                        {formatRelativeTime(notification.createdAt)}
                                    </span>
                                </div>
                                <p className={`text-xs mt-2 leading-relaxed ${!notification.isRead ? 'text-zinc-300' : 'text-zinc-400'}`}>
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
