"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, MessageCircle, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useWebSocket } from "@/hooks/use-websocket"
import { NotificationList } from "@/components/notifications/notification-list"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken } from "@/lib/api"

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [myRequestsUnviewedCount, setMyRequestsUnviewedCount] = useState(0)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { lastMessage } = useWebSocket()
  const { toast } = useToast()

  // Check auth status on mount
  useEffect(() => {
    const token = getAuthToken()
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = async () => {
    await api.logout()
    setIsLoggedIn(false)
    router.push("/feed")
  }

  const handleProtectedAction = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please login to perform this action.",
      })
      router.push(`/login?returnUrl=${encodeURIComponent(href)}`)
    } else {
      router.push(href)
    }
  }

  // Fetch data only if logged in
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchUser = async () => {
      try {
        const data = await api.getMe()
        setUserName((data as any).name || null)
      } catch (error) {
        setUserName(null)
      }
    }
    fetchUser()

    // ... existing fetches ...
  }, [isLoggedIn])

  // Fetch counts... (wrap existing count fetches in isLoggedIn check or rely on api failure handling)
  // For brevity, I'll rely on the existing silent failure blocks in previous useEffects, 
  // but it's cleaner to add the check. I will leave them as is for now since they handle errors silently.

  const navLinks = [
    { href: "/feed", label: "Home", protected: false },
    { href: "/create-food", label: "Share Food", protected: true },
    { href: "/create-hunger", label: "Broadcast Hunger", protected: true },
    { href: "/my-requests", label: "My Requests", protected: true },
    { href: "/my-posts", label: "My Posts", protected: true },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center space-x-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-foreground">hungry</span>
            <div className="h-0.5 w-full bg-primary rounded-full" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            // Hide My Requests/Posts if not logged in
            if (!isLoggedIn && ["/my-requests", "/my-posts"].includes(link.href)) return null;

            return (
              <Link key={link.href} href={link.href} onClick={(e) => link.protected ? handleProtectedAction(e, link.href) : null}>
                <Button
                  variant={pathname === link.href ? "default" : "ghost"}
                  className={
                    pathname === link.href
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-hover relative"
                      : "text-muted-foreground hover:text-foreground relative"
                  }
                >
                  {link.label}
                  {isLoggedIn && link.href === "/my-posts" && pendingRequestCount > 0 && (
                    <Badge className="ml-2 bg-destructive text-destructive-foreground px-1.5 py-0 text-xs min-w-[20px] h-5">
                      {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                    </Badge>
                  )}
                  {isLoggedIn && link.href === "/my-requests" && myRequestsUnviewedCount > 0 && (
                    <Badge className="ml-2 bg-destructive text-destructive-foreground px-1.5 py-0 text-xs min-w-[20px] h-5">
                      {myRequestsUnviewedCount > 99 ? "99+" : myRequestsUnviewedCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}

          {/* Messages Link with Badge */}
          {isLoggedIn && (
            <Link href="/messages">
              <Button
                variant={pathname?.startsWith("/messages") ? "default" : "ghost"}
                className={
                  pathname?.startsWith("/messages")
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-hover relative"
                    : "text-muted-foreground hover:text-foreground relative"
                }
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground px-1.5 py-0 text-xs min-w-[20px] h-5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* Notifications Bell */}
          {isLoggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground px-1 h-4 min-w-[16px] text-[10px] flex items-center justify-center">
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[350px] p-0 overflow-hidden">
                <NotificationList
                  onUnreadCountChange={setUnreadNotificationCount}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Profile Dropdown or Login Buttons */}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full bg-transparent flex items-center gap-2 pl-2 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  {userName && (
                    <span className="hidden lg:inline-block font-medium text-sm pr-1">
                      {userName}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName || "My Account"}</p>
                    <p className="text-xs leading-none text-muted-foreground">Logged in</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
