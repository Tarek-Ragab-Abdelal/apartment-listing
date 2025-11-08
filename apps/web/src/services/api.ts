const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

//#region Type Definitions
// Type definitions based on the Swagger API
export type UserRole = 'ADMIN' | 'USER' | 'AGENT';
export type ApartmentStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  cityId: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: City;
}

export interface Apartment {
  id: string;
  projectId: string;
  unitName: string;
  unitNumber?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  priceEgp?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  listerId: string;
  status: ApartmentStatus;
  createdAt: string;
  updatedAt?: string;
  project?: Project;
  lister?: User;
  images?: ApartmentImage[];
  amenities?: ApartmentAmenity[];
}

export interface ApartmentImage {
  id: string;
  apartmentId: string;
  imageUrl: string;
  position: number;
  createdAt: string;
}

export interface ApartmentAmenity {
  id: string;
  apartmentId: string;
  amenity: string;
}

export interface ApartmentFilters {
  projectId?: string | string[];
  cityId?: string | string[];
  listerId?: string;
  status?: ApartmentStatus | ApartmentStatus[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number | number[];
  bathrooms?: number | number[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface ApartmentSearchBody {
  projectIds?: string[];
  cityIds?: string[];
  listerIds?: string[];
  statuses?: ApartmentStatus[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WatchlistItem {
  userId: string;
  apartmentId: string;
  createdAt: string;
  apartment?: Apartment;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isRead: boolean;
  readAt?: string;
  editedAt?: string;
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  apartmentId: string;
  user1Id: string;
  user2Id: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  apartment?: Apartment;
  user1?: User;
  user2?: User;
  lastMessage?: Message;
  unreadCount?: number;
}
//#endregion

//#region Helper Functions
// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function to build URL with query params
const buildUrl = (baseUrl: string, params?: URLSearchParams) => {
  if (!params?.toString()) {
    return baseUrl;
  }
  return `${baseUrl}?${params.toString()}`;
};

// Helper function to convert ApartmentFilters to ApartmentSearchBody
const convertFiltersToSearchBody = (filters: ApartmentFilters): ApartmentSearchBody => {
  const searchBody: ApartmentSearchBody = {};
  
  // Convert single values or arrays to arrays for the new API
  if (filters.projectId) {
    searchBody.projectIds = Array.isArray(filters.projectId) ? filters.projectId : [filters.projectId];
  }
  
  if (filters.cityId) {
    searchBody.cityIds = Array.isArray(filters.cityId) ? filters.cityId : [filters.cityId];
  }
  
  if (filters.listerId) {
    searchBody.listerIds = [filters.listerId];
  }
  
  if (filters.status) {
    searchBody.statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
  }
  
  // Copy simple properties
  if (filters.minPrice !== undefined) searchBody.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) searchBody.maxPrice = filters.maxPrice;
  if (filters.minArea !== undefined) searchBody.minArea = filters.minArea;
  if (filters.maxArea !== undefined) searchBody.maxArea = filters.maxArea;
  
  // For bedrooms/bathrooms, take the first value if it's an array for simplicity
  // The UI typically sends single values anyway
  if (filters.bedrooms !== undefined) {
    searchBody.bedrooms = Array.isArray(filters.bedrooms) ? filters.bedrooms[0] : filters.bedrooms;
  }
  if (filters.bathrooms !== undefined) {
    searchBody.bathrooms = Array.isArray(filters.bathrooms) ? filters.bathrooms[0] : filters.bathrooms;
  }
  
  if (filters.search) searchBody.search = filters.search;
  if (filters.page !== undefined) searchBody.page = filters.page;
  if (filters.limit !== undefined) searchBody.limit = filters.limit;
  
  return searchBody;
};
//#endregion

//#region Authentication API (/auth/*)
// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'USER' | 'AGENT';
  }): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async me(): Promise<{ success: boolean; data: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
//#endregion

//#region Cities API (/cities/*)
// Cities API
export const citiesApi = {
  async getAll(params?: { country?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.country) searchParams.append('country', params.country);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = buildUrl(`${API_BASE_URL}/cities`, searchParams);
    const response = await fetch(url);
    return handleResponse(response);
  },

  async getById(id: string) {
    const response = await fetch(`${API_BASE_URL}/cities/${id}`);
    return handleResponse(response);
  },

  async create(city: { name: string; country: string }): Promise<{ success: boolean; data: City }> {
    const response = await fetch(`${API_BASE_URL}/cities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(city),
    });
    return handleResponse(response);
  },
};
//#endregion

//#region Projects API (/projects/*)
// Projects API
export const projectsApi = {
  async getAll(params?: { cityId?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.cityId) searchParams.append('cityId', params.cityId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = buildUrl(`${API_BASE_URL}/projects`, searchParams);
    const response = await fetch(url);
    return handleResponse(response);
  },

  async getById(id: string) {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    return handleResponse(response);
  },

  async create(project: { name: string; cityId: string; description?: string }): Promise<{ success: boolean; data: Project }> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(project),
    });
    return handleResponse(response);
  },
};
//#endregion

//#region Apartments API (/apartments/*)
// Apartments API
export const apartmentApi = {
  async getAll(filters?: ApartmentFilters): Promise<{ success: boolean; data: Apartment[]; totalFiltered?: number; total?: number }> {
    const params = new URLSearchParams();
    
    // Handle array parameters by appending multiple values
    if (filters?.projectId) {
      const projectIds = Array.isArray(filters.projectId) ? filters.projectId : [filters.projectId];
      for (const id of projectIds) {
        params.append('projectId', id);
      }
    }
    if (filters?.cityId) {
      const cityIds = Array.isArray(filters.cityId) ? filters.cityId : [filters.cityId];
      for (const id of cityIds) {
        params.append('cityId', id);
      }
    }
    if (filters?.listerId) params.append('listerId', filters.listerId);
    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      for (const status of statuses) {
        params.append('status', status);
      }
    }
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.minArea) params.append('minArea', filters.minArea.toString());
    if (filters?.maxArea) params.append('maxArea', filters.maxArea.toString());
    if (filters?.bedrooms) {
      const bedrooms = Array.isArray(filters.bedrooms) ? filters.bedrooms : [filters.bedrooms];
      for (const bed of bedrooms) {
        params.append('bedrooms', bed.toString());
      }
    }
    if (filters?.bathrooms) {
      const bathrooms = Array.isArray(filters.bathrooms) ? filters.bathrooms : [filters.bathrooms];
      for (const bath of bathrooms) {
        params.append('bathrooms', bath.toString());
      }
    }
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = buildUrl(`${API_BASE_URL}/apartments`, params);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async search(searchBody: ApartmentSearchBody): Promise<{ success: boolean; data: Apartment[]; meta?: { totalFiltered: number; total: number; page: number; limit: number; totalPages: number } }> {
    const response = await fetch(`${API_BASE_URL}/apartments/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(searchBody),
    });
    return handleResponse(response);
  },

  async getById(id: string): Promise<{ success: boolean; data: Apartment }> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getRelated(id: string): Promise<{ success: boolean; data: Apartment[] }> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}/related`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async create(apartment: {
    projectId: string;
    unitName: string;
    unitNumber?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaSqm?: number;
    priceEgp?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    listerId: string;
    status?: ApartmentStatus;
  }): Promise<{ success: boolean; data: Apartment }> {
    const response = await fetch(`${API_BASE_URL}/apartments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(apartment),
    });
    return handleResponse(response);
  },

  async update(id: string, apartment: Partial<Apartment>): Promise<{ success: boolean; data: Apartment }> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(apartment),
    });
    return handleResponse(response);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/apartments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
//#endregion

//#region Watchlist API (/watchlists/*)
// Watchlist API
export const watchlistApi = {
  async getAll(params?: { userId?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = buildUrl(`${API_BASE_URL}/watchlists`, searchParams);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async add(userId: string, apartmentId: string): Promise<{ success: boolean; data: WatchlistItem }> {
    const response = await fetch(`${API_BASE_URL}/watchlists`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, apartmentId }),
    });
    return handleResponse(response);
  },

  async remove(userId: string, apartmentId: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/watchlists/${userId}/${apartmentId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return handleResponse(response);
  },
};
//#endregion

//#region Messages API (/conversations/*)
// Messages API - Conversation-based messaging system
export const messagesApi = {
  // Get all conversations for the current user
  async getConversations(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ 
    success: boolean; 
    data: Conversation[]; 
    meta: { page: number; limit: number; total: number; totalPages: number } 
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const url = buildUrl(`${API_BASE_URL}/conversations`, searchParams);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get messages in a specific conversation
  async getConversationMessages(conversationId: string, params?: {
    page?: number;
    limit?: number;
    before?: string;
  }): Promise<{ 
    success: boolean; 
    data: Message[]; 
    meta: { page: number; limit: number; total: number; totalPages: number } 
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.before) searchParams.append('before', params.before);

    const url = buildUrl(`${API_BASE_URL}/conversations/${conversationId}/messages`, searchParams);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Start a new conversation about an apartment
  async startConversation(data: {
    apartmentId: string;
    message: string;
  }): Promise<{ success: boolean; data: Conversation }> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Send a message in an existing conversation
  async sendMessage(conversationId: string, data: {
    content: string;
    messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM';
  }): Promise<{ success: boolean; data: Message }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        messageType: data.messageType || 'TEXT',
      }),
    });
    return handleResponse(response);
  },

  // Mark a specific message as read
  async markMessageAsRead(messageId: string): Promise<{ success: boolean; data: Message }> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get unread count for a specific conversation
  async getUnreadCount(conversationId: string): Promise<{ success: boolean; data: { count: number } }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/unread-count`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Legacy methods for backward compatibility (deprecated)
  async getIncoming(params?: {
    isRead?: boolean;
    apartmentId?: string;
    page?: number;
    limit?: number;
  }) {
    console.warn('messagesApi.getIncoming is deprecated. Use getConversations instead.');
    return this.getConversations(params);
  },

  async getAll(params?: {
    apartmentId?: string;
    senderId?: string;
    receiverId?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    console.warn('messagesApi.getAll is deprecated. Use getConversations instead.');
    return this.getConversations(params);
  },

  async create(messageData: {
    apartmentId: string;
    receiverId: string;
    content: string;
  }) {
    console.warn('messagesApi.create is deprecated. Use startConversation instead.');
    return this.startConversation({
      apartmentId: messageData.apartmentId,
      message: messageData.content,
    });
  },

  async getById(id: string) {
    console.warn('messagesApi.getById is deprecated.');
    throw new Error('This method is no longer supported');
  },

  async update(id: string, data: { content?: string; isRead?: boolean }) {
    if (data.isRead) {
      return this.markMessageAsRead(id);
    }
    console.warn('messagesApi.update is deprecated for content updates.');
    throw new Error('Content updates are no longer supported');
  },

  async delete(id: string) {
    console.warn('messagesApi.delete is deprecated.');
    throw new Error('Message deletion is no longer supported');
  },
};
//#endregion
