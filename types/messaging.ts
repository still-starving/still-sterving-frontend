// Messaging type definitions

export interface Conversation {
    id: string
    foodPostId: string
    participant1Id: string
    participant2Id: string
    lastMessageAt: string
    createdAt: string
    updatedAt: string
    // Extended fields from GET /conversations
    foodPostTitle?: string
    foodPostImageUrl?: string
    otherParticipantId?: string
    otherParticipantName?: string
    lastMessageContent?: string
    unreadCount?: number
}

export interface Message {
    id: string
    conversationId: string
    senderId: string
    content: string
    isRead: boolean
    createdAt: string
    senderName?: string
}

export interface CreateConversationRequest {
    foodPostId: string
    otherParticipantId: string
}

export interface GetMessagesParams {
    limit?: number
    offset?: number
}

export interface UnreadCountResponse {
    unreadCount: number
}

// WebSocket message types
export type WSMessageType =
    | 'connected'
    | 'chat'
    | 'typing'
    | 'read'
    | 'error'
    | 'food_post'
    | 'hunger_broadcast'
    | 'request_created'
    | 'request_updated'

export interface WSBaseMessage {
    type: WSMessageType
    timestamp?: string
}

export interface WSConnectedMessage extends WSBaseMessage {
    type: 'connected'
}

export interface WSChatMessageSend extends WSBaseMessage {
    type: 'chat'
    conversationId: string
    content: string
}

export interface WSChatMessageReceive extends WSBaseMessage {
    type: 'chat'
    conversationId: string
    message: Message
}

export interface WSTypingMessage extends WSBaseMessage {
    type: 'typing'
    conversationId: string
}

export interface WSReadMessage extends WSBaseMessage {
    type: 'read'
    conversationId: string
}

export interface WSErrorMessage extends WSBaseMessage {
    type: 'error'
    error: string
}

// Feed broadcast types
export interface FoodFeedItem {
    type: 'food'
    id: string
    title: string
    description: string
    quantity: string
    location: string
    expiryDate: string
    status: 'available' | 'requested' | 'taken'
    ownerName: string
    ownerId: string
    imageUrls?: string[]
    isOwner?: boolean
}

export interface HungerFeedItem {
    type: 'hunger'
    id: string
    message: string
    location: string
    urgency: 'normal' | 'urgent'
    userName: string
    ownerId: string
    timePosted: string
    isOwner?: boolean
}

export interface WSFoodPostMessage extends WSBaseMessage {
    type: 'food_post'
    foodPost: FoodFeedItem
}

export interface WSHungerBroadcastMessage extends WSBaseMessage {
    type: 'hunger_broadcast'
    hungerBroadcast: HungerFeedItem
}

// Request notification types
export interface FoodRequest {
    id: string
    foodPostId: string
    userId: string
    userName?: string
    foodTitle?: string
    status: 'pending' | 'accepted' | 'rejected'
    requestDate: string
    conversationId?: string
}

export interface WSRequestCreatedMessage extends WSBaseMessage {
    type: 'request_created'
    foodRequest: FoodRequest
}

export interface WSRequestUpdatedMessage extends WSBaseMessage {
    type: 'request_updated'
    conversationId?: string  // At root level for accepted requests
    foodRequest: FoodRequest
}

export type WSMessage =
    | WSConnectedMessage
    | WSChatMessageSend
    | WSChatMessageReceive
    | WSTypingMessage
    | WSReadMessage
    | WSErrorMessage
    | WSFoodPostMessage
    | WSHungerBroadcastMessage
    | WSRequestCreatedMessage
    | WSRequestUpdatedMessage
