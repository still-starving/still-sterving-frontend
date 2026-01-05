"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell, Check, Heart, Users, Trash2, Clock, MapPin } from "lucide-react"
import type { Notification } from "@/types/messaging"
import { Button } from "@/components/ui/button"

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
            <div className="py-12 text-center">
                <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
        )
    }

    return (
        <div className="max-h-[400px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
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
            <div className="overflow-y-auto">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`
                            px-4 py-3 border-b border-border/40 transition-colors cursor-pointer hover:bg-muted/50
                            ${!notification.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''}
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
                                    <p className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
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
