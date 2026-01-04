"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"
import { api } from "@/lib/api"

export function TopNav() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await api.logout()
  }

  const navLinks = [
    { href: "/feed", label: "Home" },
    { href: "/create-food", label: "Share Food" },
    { href: "/create-hunger", label: "Broadcast Hunger" },
    { href: "/my-requests", label: "My Requests" },
    { href: "/my-posts", label: "My Posts" },
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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href ? "default" : "ghost"}
                className={
                  pathname === link.href
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-hover"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
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
      </div>
    </nav>
  )
}
