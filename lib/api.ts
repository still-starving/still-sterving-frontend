import { mockApi } from "./mock-api"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api"
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

// Helper functions for safe localStorage access (SSR-safe)
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (USE_MOCK_API) {
    return handleMockRequest<T>(endpoint, options)
  }

  const { requiresAuth = true, ...fetchOptions } = options

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Only set Content-Type if not already set and body is not FormData
  if (!headers["Content-Type"] && !(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (requiresAuth) {
    const token = getAuthToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (response.status === 401) {
      removeAuthToken()
      window.location.href = "/login"
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

async function handleMockRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken() || ""
  const body = options.body ? JSON.parse(options.body as string) : {}

  try {
    // Auth endpoints
    if (endpoint === "/auth/register" && options.method === "POST") {
      return (await mockApi.register(body)) as T
    }
    if (endpoint === "/auth/login" && options.method === "POST") {
      return (await mockApi.login(body)) as T
    }
    if (endpoint === "/auth/me") {
      return (await mockApi.getMe(token)) as T
    }

    // Feed endpoints
    if (endpoint.startsWith("/feed")) {
      const params = new URLSearchParams(endpoint.split("?")[1])
      const type = params.get("type") as "all" | "food" | "hunger" | undefined
      return (await mockApi.getFeed(type)) as T
    }

    // Food posts endpoints
    if (endpoint === "/food-posts" && options.method === "POST") {
      return (await mockApi.createFoodPost(token, body)) as T
    }
    if (endpoint === "/food-posts") {
      return (await mockApi.getFoodPosts()) as T
    }
    if (endpoint.match(/^\/food-posts\/\d+$/)) {
      const id = endpoint.split("/")[2]
      return (await mockApi.getFoodPost(id)) as T
    }
    if (endpoint.match(/^\/food-posts\/\d+\/request$/)) {
      const id = endpoint.split("/")[2]
      return (await mockApi.requestFood(token, id)) as T
    }
    if (endpoint.match(/^\/food-posts\/\d+\/requests$/)) {
      const id = endpoint.split("/")[2]
      return (await mockApi.getFoodRequests(token, id)) as T
    }
    if (endpoint.match(/^\/food-posts\/\d+\/requests\/\d+\/accept$/)) {
      const [, , postId, , requestId] = endpoint.split("/")
      return (await mockApi.acceptRequest(token, postId, requestId)) as T
    }
    if (endpoint.match(/^\/food-posts\/\d+\/requests\/\d+\/reject$/)) {
      const [, , postId, , requestId] = endpoint.split("/")
      return (await mockApi.rejectRequest(token, postId, requestId)) as T
    }

    // Hunger broadcasts endpoints
    if (endpoint === "/hunger-broadcasts" && options.method === "POST") {
      return (await mockApi.createHungerBroadcast(token, body)) as T
    }
    if (endpoint === "/hunger-broadcasts") {
      return (await mockApi.getHungerBroadcasts()) as T
    }

    // User endpoints
    if (endpoint === "/my-requests") {
      return (await mockApi.getMyRequests(token)) as T
    }
    if (endpoint === "/my-posts") {
      return (await mockApi.getMyPosts(token)) as T
    }
    if (endpoint === "/profile") {
      return (await mockApi.getProfile(token)) as T
    }

    throw new Error("Endpoint not found")
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      removeAuthToken()
      window.location.href = "/login"
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

  getMe: () => apiRequest("/auth/me"),

  // Feed
  getFeed: (type?: "all" | "food" | "hunger") => apiRequest(`/feed${type ? `?type=${type}` : ""}`),

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
}

// Export auth helpers for use in components
export { getAuthToken, setAuthToken, removeAuthToken }

