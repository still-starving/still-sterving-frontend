
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api"

// Helper functions for safe localStorage access (SSR-safe)
// Access Token
const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

const setAccessToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token)
  }
}

const removeAccessToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token")
  }
}

// Refresh Token
const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

const setRefreshToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("refresh_token", token)
  }
}

const removeRefreshToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("refresh_token")
  }
}

// Token Expiry
const getExpiresAt = (): Date | null => {
  if (typeof window === "undefined") return null
  const expiresAt = localStorage.getItem("expires_at")
  return expiresAt ? new Date(expiresAt) : null
}

const setExpiresAt = (expiresAt: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("expires_at", expiresAt)
  }
}

const removeExpiresAt = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("expires_at")
  }
}

// Check if token needs refresh (expires in less than 1 minute)
const isTokenExpiringSoon = (): boolean => {
  const expiresAt = getExpiresAt()
  if (!expiresAt) return true

  const now = new Date()
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  return timeUntilExpiry < 60000 // Less than 1 minute
}

// Logout helper
const logout = (): void => {
  removeAccessToken()
  removeRefreshToken()
  removeExpiresAt()

  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

// Refresh access token
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      logout()
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        // Refresh token expired or invalid
        logout()
        return null
      }

      const data = await response.json()

      // Update stored tokens
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setExpiresAt(data.expiresAt)

      return data.accessToken
    } catch (error) {
      console.error("Token refresh failed:", error)
      logout()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Legacy support - map old function to new one
const getAuthToken = getAccessToken
const setAuthToken = setAccessToken
const removeAuthToken = (): void => {
  removeAccessToken()
  removeRefreshToken()
  removeExpiresAt()
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}, retryCount = 0): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Only set Content-Type if not already set and body is not FormData
  if (!headers["Content-Type"] && !(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (requiresAuth) {
    // Check if token needs refresh before making request
    if (isTokenExpiringSoon()) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`
      }
    } else {
      const token = getAccessToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    // Handle 401 - try refreshing token once
    if (response.status === 401 && retryCount === 0) {
      const newToken = await refreshAccessToken()

      if (newToken) {
        // Retry the request with new token
        return apiRequest<T>(endpoint, options, retryCount + 1)
      }

      // Refresh failed, logout handled in refreshAccessToken
      throw new Error("Unauthorized")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }))
      throw new Error(error.message || "Request failed")
    }

    return response.json()
  } catch (error) {
    // Handle network errors (e.g., backend not running)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Unable to connect to the server. Please ensure the backend is running.")
    }
    throw error
  }
}


export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: false,
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: false,
    }),

  logout: async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
          requiresAuth: false,
        })
      } catch (error) {
        console.error("Logout API call failed:", error)
      }
    }
    // Always clear tokens and redirect
    logout()
  },

  getMe: () => apiRequest("/auth/me"),

  // Feed
  getFeed: (type?: "all" | "food" | "hunger") =>
    apiRequest(`/feed${type ? `?type=${type}` : ""}`, { requiresAuth: false }),

  // Food Posts
  createFoodPost: (data: any) => {
    const isFormData = data instanceof FormData
    return apiRequest("/food-posts", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : { "Content-Type": "application/json" },
    })
  },

  getFoodPosts: () => apiRequest("/food-posts"),

  getFoodPost: (id: string) => apiRequest(`/food-posts/${id}`),

  updateFoodPost: (id: string, data: any) =>
    apiRequest(`/food-posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteFoodPost: (id: string) => apiRequest(`/food-posts/${id}`, { method: "DELETE" }),

  requestFood: (id: string) => apiRequest(`/food-posts/${id}/request`, { method: "POST" }),

  getFoodRequests: (id: string) => apiRequest(`/food-posts/${id}/requests`),

  acceptRequest: (postId: string, requestId: string) =>
    apiRequest(`/food-posts/${postId}/requests/${requestId}/accept`, {
      method: "PUT",
    }),

  rejectRequest: (postId: string, requestId: string) =>
    apiRequest(`/food-posts/${postId}/requests/${requestId}/reject`, {
      method: "PUT",
    }),

  // Hunger Broadcasts
  createHungerBroadcast: (data: any) =>
    apiRequest("/hunger-broadcasts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getHungerBroadcasts: () => apiRequest("/hunger-broadcasts"),

  getHungerBroadcast: (id: string) => apiRequest(`/hunger-broadcasts/${id}`),

  deleteHungerBroadcast: (id: string) => apiRequest(`/hunger-broadcasts/${id}`, { method: "DELETE" }),

  resolveHungerBroadcast: (id: string) => apiRequest(`/hunger-broadcasts/${id}/resolve`, { method: "PUT" }),

  offerFood: (id: string) => apiRequest(`/hunger-broadcasts/${id}/offer`, { method: "POST" }),

  // User
  getMyRequests: () => apiRequest("/my-requests"),

  getMyPosts: () => apiRequest("/my-posts"),

  getMyHungerBroadcasts: () => apiRequest("/my-hunger-broadcasts"),

  getProfile: () => apiRequest("/profile"),

  updateProfile: (data: any) =>
    apiRequest("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Messaging
  createConversation: (data: { foodPostId?: string; otherParticipantId: string; hungerBroadcastId?: string }) =>
    apiRequest("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getConversations: () => apiRequest("/conversations"),

  getConversationMessages: (conversationId: string, params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.offset) queryParams.append("offset", params.offset.toString())
    const query = queryParams.toString()
    return apiRequest(`/conversations/${conversationId}/messages${query ? `?${query}` : ""}`)
  },

  sendMessage: (conversationId: string, data: { content: string; type?: string; metadata?: any }) =>
    apiRequest(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  markMessagesAsRead: (conversationId: string) =>
    apiRequest(`/conversations/${conversationId}/messages/read`, {
      method: "PUT",
    }),

  getUnreadCount: () => apiRequest("/messages/unread-count"),

  // Notifications
  getNotifications: () => apiRequest("/notifications"),
  markNotificationAsRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: "PUT" }),
  getUnreadNotificationsCount: () => apiRequest("/notifications/unread-count"),

  // Request count
  getPendingRequestsCount: () => apiRequest("/my-food-requests/pending-count"),

  // My Requests unviewed count
  getMyRequestsUnviewedCount: () => apiRequest("/my-requests/unviewed-count"),
  markMyRequestsAsViewed: () => apiRequest("/my-requests/mark-viewed", { method: "PUT" }),
}

// Export auth helpers for use in components
export { getAuthToken, setAuthToken, removeAuthToken, getAccessToken }


