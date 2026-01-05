import { getAccessToken } from "./api"

type MessageHandler = (message: any) => void

class WebSocketManager {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000
    private messageHandlers: Set<MessageHandler> = new Set()
    private messageQueue: any[] = []
    private isConnecting = false

    connect(token: string) {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
            return
        }

        this.isConnecting = true
        const wsUrl = `ws://localhost:8000/api/ws?token=${token}`

        try {
            this.ws = new WebSocket(wsUrl)

            this.ws.onopen = () => {
                console.log("✅ WebSocket connected")
                this.isConnecting = false
                this.reconnectAttempts = 0
                this.reconnectDelay = 1000

                // Send queued messages
                while (this.messageQueue.length > 0) {
                    const message = this.messageQueue.shift()
                    this.send(message)
                }
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    console.log('📨 WebSocket message received:', message)
                    this.notifyHandlers(message)
                } catch (error) {
                    console.error("Failed to parse WebSocket message:", error)
                }
            }

            this.ws.onerror = () => {
                // Silently handle WebSocket errors (backend may not be running)
                this.isConnecting = false
            }

            this.ws.onclose = () => {
                // Silently handle disconnect (backend may not be running)
                this.isConnecting = false
                this.ws = null
                this.attemptReconnect(token)
            }
        } catch (error) {
            console.error("Failed to create WebSocket:", error)
            this.isConnecting = false
            this.attemptReconnect(token)
        }
    }

    private attemptReconnect(token: string) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            // Silently stop reconnecting after max attempts
            return
        }

        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

        // Silently retry connection
        setTimeout(() => {
            this.connect(token)
        }, delay)
    }

    disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
        this.messageQueue = []
        this.reconnectAttempts = 0
    }

    send(message: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            // Queue message if not connected
            this.messageQueue.push(message)

            // Try to reconnect if not already connecting
            const token = getAccessToken()
            if (token && !this.isConnecting) {
                this.connect(token)
            }
        }
    }

    addMessageHandler(handler: MessageHandler) {
        this.messageHandlers.add(handler)
    }

    removeMessageHandler(handler: MessageHandler) {
        this.messageHandlers.delete(handler)
    }

    private notifyHandlers(message: any) {
        this.messageHandlers.forEach((handler) => {
            try {
                handler(message)
            } catch (error) {
                console.error("Error in message handler:", error)
            }
        })
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

// Singleton instance
export const wsManager = new WebSocketManager()
