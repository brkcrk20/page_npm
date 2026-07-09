// src/types/enums.ts
//
// Bu dosya, Firestore veri modelinde kullanılan sabit değer kümelerini (enum)
// tanımlar. Sadece tip katmanına aittir; herhangi bir component, sayfa veya
// Firebase sorgusu bu dosyayı henüz kullanmamaktadır.

/** Bir ilanın/evcil hayvanın türü. */
export enum Species {
  Dog = 'dog',
  Cat = 'cat',
  Bird = 'bird',
  Aquarium = 'aquarium',
  Other = 'other',
}

/** Cinsiyet bilgisi. */
export enum Gender {
  Male = 'male',
  Female = 'female',
  Unknown = 'unknown',
}

/** Bir ilanın (Ad) yaşam döngüsü durumu. */
export enum AdStatus {
  Draft = 'draft',
  Pending = 'pending',
  Active = 'active',
  Passive = 'passive',
  Sold = 'sold',
  Expired = 'expired',
  Rejected = 'rejected',
  Removed = 'removed',
}

/** Bir evcil hayvan kaydının (Pet) durumu. */
export enum PetStatus {
  Available = 'available',
  Reserved = 'reserved',
  Adopted = 'adopted',
  Sold = 'sold',
  Lost = 'lost',
  Deceased = 'deceased',
}

/** Kullanıcı rolü / yetki seviyesi. */
export enum UserRole {
  User = 'user',
  Company = 'company',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

/** Sunulan hizmet türü (veteriner, petshop, pet taksi, gezdirici vb.). */
export enum ServiceType {
  Veterinary = 'veterinary',
  PetShop = 'pet_shop',
  PetTaxi = 'pet_taxi',
  DogWalker = 'dog_walker',
  Groomer = 'pet_groomer',
  PetHotel = 'pet_hotel',
  Trainer = 'trainer',
  Other = 'other',
}

/** İlanın satış/sahiplendirme tipi. */
export enum ListingType {
  Sale = 'sale',
  Adoption = 'adoption',
  Lost = 'lost',
  Found = 'found',
  Mating = 'mating',
}

/** Konuşma/mesajlaşma oturumunun durumu. */
export enum ConversationStatus {
  Active = 'active',
  Archived = 'archived',
  Blocked = 'blocked',
}

/** Bir mesajın okunma/gönderilme durumu. */
export enum MessageStatus {
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read',
}

/** Bildirim türü. */
export enum NotificationType {
  NewMessage = 'new_message',
  NewFavorite = 'new_favorite',
  AdApproved = 'ad_approved',
  AdRejected = 'ad_rejected',
  NewReview = 'new_review',
  System = 'system',
}

/** Şikayet/rapor edilen içerik türü. */
export enum ReportTargetType {
  Ad = 'ad',
  User = 'user',
  Service = 'service',
  Review = 'review',
  Message = 'message',
}

/** Şikayetin işlem durumu. */
export enum ReportStatus {
  Open = 'open',
  InReview = 'in_review',
  Resolved = 'resolved',
  Dismissed = 'dismissed',
}

/** Abonelik planı. */
export enum SubscriptionPlan {
  Free = 'free',
  Basic = 'basic',
  Premium = 'premium',
  Corporate = 'corporate',
}

/** Abonelik durumu. */
export enum SubscriptionStatus {
  Active = 'active',
  Canceled = 'canceled',
  Expired = 'expired',
  PastDue = 'past_due',
}

/** Ödeme durumu. */
export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded',
}

/** Ödemenin amacı/nedeni. */
export enum PaymentType {
  Subscription = 'subscription',
  FeaturedAd = 'featured_ad',
  Other = 'other',
}
