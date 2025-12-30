// Mock API for testing without backend
// This simulates API responses with dummy data

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

interface FoodPost {
  id: string
  title: string
  description: string
  cuisine: string
  quantity: string
  pickupTime: string
  location: string
  imageUrl?: string
  userId: string
  userName: string
  status: "available" | "claimed" | "expired"
  createdAt: string
}

interface HungerBroadcast {
  id: string
  message: string
  location: string
  urgent: boolean
  userId: string
  userName: string
  createdAt: string
}

interface Request {
  id: string
  postId: string
  userId: string
  userName: string
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

// Dummy users
const MOCK_USERS: User[] = [
  { id: "1", name: "Test User", email: "test@example.com", createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", name: "John Doe", email: "john@example.com", createdAt: "2024-01-02T00:00:00Z" },
  { id: "3", name: "Jane Smith", email: "jane@example.com", createdAt: "2024-01-03T00:00:00Z" },
]

// Current logged-in user
let currentUser: User | null = null

// Mock data storage
const mockFoodPosts: FoodPost[] = [
  {
    id: "1",
    title: "Fresh Pizza - 2 Large Pies",
    description: "Have 2 large pizzas left from party. Pepperoni and veggie. Still hot!",
    cuisine: "Italian",
    quantity: "2 pizzas",
    pickupTime: "Today 8-9 PM",
    location: "Downtown, 5th Street",
    userId: "2",
    userName: "John Doe",
    status: "available",
    createdAt: "2024-01-15T18:00:00Z",
  },
  {
    id: "2",
    title: "Home-cooked Indian Curry",
    description: "Made too much curry and rice. Enough for 3-4 people. Vegetarian friendly.",
    cuisine: "Indian",
    quantity: "4 servings",
    pickupTime: "Tomorrow 12-2 PM",
    location: "East Side, Park Avenue",
    userId: "3",
    userName: "Jane Smith",
    status: "available",
    createdAt: "2024-01-15T17:30:00Z",
  },
]

const mockHungerBroadcasts: HungerBroadcast[] = [
  {
    id: "1",
    message: "Looking for a meal for tonight. Any help appreciated.",
    location: "Near Central Station",
    urgent: true,
    userId: "2",
    userName: "John Doe",
    createdAt: "2024-01-15T19:00:00Z",
  },
]

const mockRequests: Request[] = []

// Helper to generate token
const generateToken = (userId: string) => {
  return `mock_token_${userId}_${Date.now()}`
}

// Helper to extract userId from token
const getUserIdFromToken = (token: string): string | null => {
  const match = token.match(/mock_token_(\d+)_/)
  return match ? match[1] : null
}

export const mockApi = {
  // Auth
  register: async (data: { name: string; email: string; password: string }) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if user exists
    const existingUser = MOCK_USERS.find((u) => u.email === data.email)
    if (existingUser) {
      throw new Error("User already exists")
    }

    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
    }

    MOCK_USERS.push(newUser)

    return { message: "User registered successfully" }
  },

  login: async (data: { email: string; password: string }) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = MOCK_USERS.find((u) => u.email === data.email)
    if (!user) {
      throw new Error("Invalid credentials")
    }

    currentUser = user
    const token = generateToken(user.id)

    return { token, user }
  },

  getMe: async (token: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const userId = getUserIdFromToken(token)
    if (!userId) {
      throw new Error("Invalid token")
    }

    const user = MOCK_USERS.find((u) => u.id === userId)
    if (!user) {
      throw new Error("User not found")
    }

    return user
  },

  // Feed
  getFeed: async (type?: "all" | "food" | "hunger") => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const feed: any[] = []

    if (!type || type === "all" || type === "food") {
      feed.push(
        ...mockFoodPosts.map((post) => ({
          ...post,
          type: "food",
        })),
      )
    }

    if (!type || type === "all" || type === "hunger") {
      feed.push(
        ...mockHungerBroadcasts.map((broadcast) => ({
          ...broadcast,
          type: "hunger",
        })),
      )
    }

    // Sort by date
    return feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  // Food Posts
  createFoodPost: async (token: string, data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    const user = MOCK_USERS.find((u) => u.id === userId)

    const newPost: FoodPost = {
      id: String(mockFoodPosts.length + 1),
      ...data,
      userId,
      userName: user?.name || "Unknown",
      status: "available",
      createdAt: new Date().toISOString(),
    }

    mockFoodPosts.push(newPost)
    return newPost
  },

  getFoodPosts: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockFoodPosts
  },

  getFoodPost: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const post = mockFoodPosts.find((p) => p.id === id)
    if (!post) throw new Error("Post not found")
    return post
  },

  requestFood: async (token: string, id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    const user = MOCK_USERS.find((u) => u.id === userId)
    const post = mockFoodPosts.find((p) => p.id === id)
    if (!post) throw new Error("Post not found")

    const newRequest: Request = {
      id: String(mockRequests.length + 1),
      postId: id,
      userId,
      userName: user?.name || "Unknown",
      message: "I would like to request this food",
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    mockRequests.push(newRequest)
    return newRequest
  },

  getFoodRequests: async (token: string, id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    return mockRequests.filter((r) => r.postId === id)
  },

  acceptRequest: async (token: string, postId: string, requestId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const request = mockRequests.find((r) => r.id === requestId && r.postId === postId)
    if (!request) throw new Error("Request not found")

    request.status = "accepted"
    return request
  },

  rejectRequest: async (token: string, postId: string, requestId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const request = mockRequests.find((r) => r.id === requestId && r.postId === postId)
    if (!request) throw new Error("Request not found")

    request.status = "rejected"
    return request
  },

  // Hunger Broadcasts
  createHungerBroadcast: async (token: string, data: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    const user = MOCK_USERS.find((u) => u.id === userId)

    const newBroadcast: HungerBroadcast = {
      id: String(mockHungerBroadcasts.length + 1),
      ...data,
      userId,
      userName: user?.name || "Unknown",
      createdAt: new Date().toISOString(),
    }

    mockHungerBroadcasts.push(newBroadcast)
    return newBroadcast
  },

  getHungerBroadcasts: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockHungerBroadcasts
  },

  // User
  getMyRequests: async (token: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    return mockRequests.filter((r) => r.userId === userId)
  },

  getMyPosts: async (token: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    return {
      foodPosts: mockFoodPosts.filter((p) => p.userId === userId),
      hungerBroadcasts: mockHungerBroadcasts.filter((h) => h.userId === userId),
    }
  },

  getProfile: async (token: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const userId = getUserIdFromToken(token)
    if (!userId) throw new Error("Unauthorized")

    const user = MOCK_USERS.find((u) => u.id === userId)
    if (!user) throw new Error("User not found")

    return {
      ...user,
      stats: {
        foodShared: mockFoodPosts.filter((p) => p.userId === userId).length,
        peopleHelped: mockRequests.filter((r) => r.status === "accepted").length,
        activePosts: mockFoodPosts.filter((p) => p.userId === userId && p.status === "available").length,
      },
    }
  },
}
