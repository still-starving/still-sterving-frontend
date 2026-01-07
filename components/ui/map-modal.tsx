"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, X, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateDistance } from "@/lib/geo"

interface MapModalProps {
    isOpen: boolean
    onClose: () => void
    location: string
    latitude?: number
    longitude?: number
    userLocation?: { lat: number; lng: number }
    title?: string
}

export function MapModal({ isOpen, onClose, location, latitude, longitude, userLocation, title }: MapModalProps) {
    const encodedLocation = encodeURIComponent(location)

    // Calculate distance if both target and user locations are available
    const distance = (latitude && longitude && userLocation)
        ? calculateDistance(userLocation.lat, userLocation.lng, latitude, longitude).toFixed(1)
        : null

    // Prioritize lat/lng for higher accuracy
    const query = latitude && longitude ? `${latitude},${longitude}` : encodedLocation
    const mapUrl = `https://www.google.com/maps?q=${query}&output=embed`

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden bg-card border-border/50" showCloseButton={false}>
                {/* Header */}
                <DialogHeader className="p-6 pb-4 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/20">
                                <MapPin className="h-5 w-5 text-secondary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                                    {title || "Location"}
                                    {distance !== null && (
                                        <Badge variant="secondary" className="h-5 text-[10px] px-1.5 bg-secondary/10 text-secondary border-secondary/20 font-medium">
                                            <Navigation className="h-2.5 w-2.5 mr-1" />
                                            {distance} km away
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1">{location}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Map Container */}
                <div className="relative w-full h-[500px] bg-muted/20">
                    <iframe
                        src={mapUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                    />
                </div>

                {/* Footer */}
                <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Powered by Google Maps
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank')
                        }}
                    >
                        Open in Google Maps
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
