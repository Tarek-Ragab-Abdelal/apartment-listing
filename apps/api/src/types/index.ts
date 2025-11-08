import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const UuidParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID format')
});

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'AGENT']).optional().default('USER'),
});

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'USER', 'AGENT']).optional().default('USER'),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'USER', 'AGENT']).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isVerified: z.boolean().optional(),
});

export const UserQuerySchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'AGENT']).optional(),
  isVerified: z.boolean().optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

// City schemas
export const CreateCitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  country: z.string().min(1, 'Country is required'),
});

export const UpdateCitySchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
});

export const CityQuerySchema = z.object({
  country: z.string().optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

// Project schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  cityId: z.string().uuid('Invalid city ID'),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cityId: z.string().uuid().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const ProjectQuerySchema = z.object({
  cityId: z.string().uuid().optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

// Apartment schemas
export const CreateApartmentSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  unitName: z.string().min(1, 'Unit name is required'),
  unitNumber: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  areaSqm: z.number().positive().optional(),
  priceEgp: z.number().positive().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  listerId: z.string().uuid('Invalid lister ID'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD']).optional().default('ACTIVE'),
});

export const UpdateApartmentSchema = z.object({
  projectId: z.string().uuid().optional(),
  unitName: z.string().min(1).optional(),
  unitNumber: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  areaSqm: z.number().positive().optional(),
  priceEgp: z.number().positive().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  listerId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD']).optional(),
});

export const ApartmentQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  listerId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minArea: z.coerce.number().positive().optional(),
  maxArea: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

export const ApartmentSearchSchema = z.object({
  projectIds: z.array(z.string().uuid()).optional(),
  cityIds: z.array(z.string().uuid()).optional(),
  listerIds: z.array(z.string().uuid()).optional(),
  statuses: z.array(z.enum(['ACTIVE', 'INACTIVE', 'SOLD'])).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

// Apartment Image schemas
export const CreateApartmentImageSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  imageUrl: z.string().url('Invalid image URL'),
  position: z.number().int().min(0).optional(),
});

export const UpdateApartmentImageSchema = z.object({
  imageUrl: z.string().url().optional(),
  position: z.number().int().min(0).optional(),
});

// Apartment Amenity schemas
export const CreateApartmentAmenitySchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  amenity: z.string().min(1, 'Amenity is required'),
});

export const UpdateApartmentAmenitySchema = z.object({
  amenity: z.string().min(1).optional(),
});

// Message schemas
export const CreateMessageSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  senderId: z.string().uuid('Invalid sender ID'),
  receiverId: z.string().uuid('Invalid receiver ID'),
  content: z.string().min(1, 'Content is required'),
});

export const UpdateMessageSchema = z.object({
  content: z.string().min(1).optional(),
  isRead: z.boolean().optional(),
});

export const MessageQuerySchema = z.object({
  apartmentId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  isRead: z.boolean().optional(),
}).merge(PaginationSchema);

// Watchlist schemas
export const CreateWatchlistSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  apartmentId: z.string().uuid('Invalid apartment ID'),
});

export const WatchlistQuerySchema = z.object({
  userId: z.string().uuid().optional(),
}).merge(PaginationSchema);

// Review schemas
export const CreateReviewSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  userId: z.string().uuid('Invalid user ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export const ReviewQuerySchema = z.object({
  apartmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
}).merge(PaginationSchema);

// Visit schemas
export const CreateVisitSchema = z.object({
  apartmentId: z.string().uuid('Invalid apartment ID'),
  userId: z.string().uuid('Invalid user ID'),
  scheduledAt: z.string().datetime('Invalid date format'),
});

export const UpdateVisitSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  confirmed: z.boolean().optional(),
});

export const VisitQuerySchema = z.object({
  apartmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  confirmed: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
}).merge(PaginationSchema);

// Type exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;

export type CreateCityInput = z.infer<typeof CreateCitySchema>;
export type UpdateCityInput = z.infer<typeof UpdateCitySchema>;
export type CityQuery = z.infer<typeof CityQuerySchema>;

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectQuery = z.infer<typeof ProjectQuerySchema>;

export type CreateApartmentInput = z.infer<typeof CreateApartmentSchema>;
export type UpdateApartmentInput = z.infer<typeof UpdateApartmentSchema>;
export type ApartmentQuery = z.infer<typeof ApartmentQuerySchema>;
export type ApartmentSearch = z.infer<typeof ApartmentSearchSchema>;

export type CreateApartmentImageInput = z.infer<typeof CreateApartmentImageSchema>;
export type UpdateApartmentImageInput = z.infer<typeof UpdateApartmentImageSchema>;

export type CreateApartmentAmenityInput = z.infer<typeof CreateApartmentAmenitySchema>;
export type UpdateApartmentAmenityInput = z.infer<typeof UpdateApartmentAmenitySchema>;

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type MessageQuery = z.infer<typeof MessageQuerySchema>;

export type CreateWatchlistInput = z.infer<typeof CreateWatchlistSchema>;
export type WatchlistQuery = z.infer<typeof WatchlistQuerySchema>;

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type ReviewQuery = z.infer<typeof ReviewQuerySchema>;

export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;
export type UpdateVisitInput = z.infer<typeof UpdateVisitSchema>;
export type VisitQuery = z.infer<typeof VisitQuerySchema>;

export type UuidParams = z.infer<typeof UuidParamsSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;

// Authentication types
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}