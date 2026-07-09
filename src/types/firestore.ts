// src/types/firestore.ts
//
// Bu dosya, uygulamanın Firestore veri modelini tanımlayan TypeScript
// interface'lerini içerir. Sadece tip (model) katmanıdır:
//   - Hiçbir component, sayfa veya UI değiştirilmemiştir.
//   - Hiçbir Firebase sorgusu değiştirilmemiş veya eklenmemiştir.
//   - Hiçbir sayfa henüz bu modele bağlanmamıştır.
//
// Enum tanımları için bkz. src/types/enums.ts

import type { Timestamp } from 'firebase/firestore';
import {
  AdStatus,
  ConversationStatus,
  Gender,
  ListingType,
  MessageStatus,
  NotificationType,
  PaymentStatus,
  PaymentType,
  PetStatus,
  ReportStatus,
  ReportTargetType,
  ServiceType,
  Species,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from './enums';

/**
 * Tüm Firestore doküman tiplerinin ortak alanları.
 * Her interface bu tipi extend ederek id / createdAt / updatedAt alanlarını
 * ortak şekilde miras alır.
 */
export interface BaseDocument {
  /** Firestore doküman kimliği (doc.id). */
  id: string;
  /** Dokümanın oluşturulma zamanı. */
  createdAt: Timestamp;
  /** Dokümanın son güncellenme zamanı. */
  updatedAt: Timestamp;
}

/** Basit coğrafi konum bilgisi (il/ilçe ve opsiyonel koordinatlar). */
export interface GeoLocation {
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
}

/* ------------------------------------------------------------------ */
/* User                                                                */
/* ------------------------------------------------------------------ */

export interface User extends BaseDocument {
  uid: string;
  name: string;
  username?: string;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
  role: UserRole;
  location?: GeoLocation;
  bio?: string;

  /** Bireysel değil kurumsal kullanıcı ise şirket bilgileri. */
  companyTitle?: string;
  companyType?: string;
  taxNo?: string;
  taxOffice?: string;
  companyAddress?: string;
  tcNo?: string;

  favoritePetIds?: string[];
  credit?: number;
  isVerified?: boolean;
  isBanned?: boolean;
}

/* ------------------------------------------------------------------ */
/* Pet                                                                 */
/* ------------------------------------------------------------------ */

export interface Pet extends BaseDocument {
  ownerId: string;
  name: string;
  species: Species;
  breed?: string;
  gender?: Gender;
  age?: number;
  color?: string;
  description?: string;
  imageUrls?: string[];
  status: PetStatus;
  isVaccinated?: boolean;
  isNeutered?: boolean;
  weightKg?: number;
  location?: GeoLocation;
}

/* ------------------------------------------------------------------ */
/* Ad (İlan)                                                           */
/* ------------------------------------------------------------------ */

export interface Ad extends BaseDocument {
  userId: string;
  petId?: string;
  title: string;
  description: string;
  species: Species;
  listingType: ListingType;
  status: AdStatus;
  price?: number;
  location?: GeoLocation;
  imageUrls?: string[];
  isFeatured?: boolean;
  viewCount?: number;
  favoriteCount?: number;
  expiresAt?: Timestamp;
}

/* ------------------------------------------------------------------ */
/* Service (Hizmet - veteriner, petshop, pet taksi, vb.)               */
/* ------------------------------------------------------------------ */

export interface Service extends BaseDocument {
  userId: string;
  name: string;
  type: ServiceType;
  description: string;
  address: string;
  phoneNumber: string;
  websiteUrl?: string;
  location?: GeoLocation;
  imageUrls?: string[];
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
}

/* ------------------------------------------------------------------ */
/* Favorite                                                            */
/* ------------------------------------------------------------------ */

export interface Favorite extends BaseDocument {
  userId: string;
  /** Favoriye eklenen içeriğin id'si (ilan, hizmet vb.). */
  targetId: string;
  targetType: 'ad' | 'service' | 'pet';
}

/* ------------------------------------------------------------------ */
/* Conversation                                                        */
/* ------------------------------------------------------------------ */

export interface Conversation extends BaseDocument {
  participantIds: string[];
  adId?: string;
  status: ConversationStatus;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  /** Kullanıcı id'sine göre okunmamış mesaj sayısı. */
  unreadCounts?: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* Message                                                             */
/* ------------------------------------------------------------------ */

export interface Message extends BaseDocument {
  conversationId: string;
  senderId: string;
  text: string;
  status: MessageStatus;
  imageUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

export interface Review extends BaseDocument {
  targetId: string;
  targetType: 'service' | 'user';
  authorId: string;
  rating: number;
  comment?: string;
}

/* ------------------------------------------------------------------ */
/* Notification                                                        */
/* ------------------------------------------------------------------ */

export interface Notification extends BaseDocument {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  isRead: boolean;
  linkUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Report (Şikayet)                                                    */
/* ------------------------------------------------------------------ */

export interface Report extends BaseDocument {
  reporterId: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: string;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
}

/* ------------------------------------------------------------------ */
/* Subscription                                                        */
/* ------------------------------------------------------------------ */

export interface Subscription extends BaseDocument {
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: Timestamp;
  currentPeriodEnd: Timestamp;
  canceledAt?: Timestamp;
  autoRenew?: boolean;
}

/* ------------------------------------------------------------------ */
/* Payment                                                             */
/* ------------------------------------------------------------------ */

export interface Payment extends BaseDocument {
  userId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  relatedSubscriptionId?: string;
  relatedAdId?: string;
  provider?: string;
  providerTransactionId?: string;
}
