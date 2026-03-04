export type ListingCondition = "new_with_tags" | "like_new" | "good" | "fair";
export type ListingStatus = "available" | "reserved" | "sold" | "hidden";
export type VerificationStatus = "unverified" | "pending" | "verified" | "failed";

export type ClothingCategory =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Activewear"
  | "Shoes"
  | "Accessories"
  | "Kids"
  | "Other";

export interface User {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  locationLat?: number;
  locationLng?: number;
  defaultRadiusKm?: number;
  verificationStatus: VerificationStatus;
  ratingAvg?: number;
  ratingCount?: number;
  followerCount?: number;
  followingCount?: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  seller?: User;
  title: string;
  description?: string;
  category: ClothingCategory;
  brand?: string;
  sizeValue?: string;
  condition: ListingCondition;
  colors?: string[];
  price: number;
  currency: string;
  photos: string[];
  locationLat?: number;
  locationLng?: number;
  distance?: number;
  status: ListingStatus;
  tags?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId?: string;
  listing?: Listing;
  buyerId: string;
  sellerId: string;
  otherUser?: User;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  listingId?: string;
  rating: number;
  text?: string;
  createdAt: string;
}

export interface WishlistCollection {
  id: string;
  name: string;
  userId: string;
  isShared: boolean;
  itemCount?: number;
}

export interface WishlistItem {
  id: string;
  collectionId: string;
  listingId: string;
  listing?: Listing;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  default_radius_km?: number;
  currency?: string;
  units?: string;
  language?: string;
  location_lat?: number;
  location_lng?: number;
  onboarding_completed?: boolean;
  created_at: string;
}

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new_with_tags: "New with Tags",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
};

export const CONDITION_COLORS: Record<ListingCondition, string> = {
  new_with_tags: "bg-secondary text-secondary-foreground",
  like_new: "bg-secondary/70 text-secondary-foreground",
  good: "bg-blue-500/20 text-blue-400",
  fair: "bg-orange-500/20 text-orange-400",
};

export const CATEGORIES: ClothingCategory[] = [
  "Tops", "Bottoms", "Dresses", "Outerwear",
  "Activewear", "Shoes", "Accessories", "Kids", "Other",
];
