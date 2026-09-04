export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      breeds: {
        Row: {
          category_id: number
          created_at: string
          group_name: string | null
          id: number
          is_active: boolean
          is_restricted: boolean
          name: string
          position: number
          restriction_note: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: number
          created_at?: string
          group_name?: string | null
          id?: never
          is_active?: boolean
          is_restricted?: boolean
          name: string
          position?: number
          restriction_note?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: number
          created_at?: string
          group_name?: string | null
          id?: never
          is_active?: boolean
          is_restricted?: boolean
          name?: string
          position?: number
          restriction_note?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_listing_counts"
            referencedColumns: ["category_id"]
          },
        ]
      }
      categories: {
        Row: {
          code: string
          created_at: string
          icon: string | null
          id: number
          is_active: boolean
          name: string
          position: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          icon?: string | null
          id: number
          is_active?: boolean
          name: string
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          icon?: string | null
          id?: number
          is_active?: boolean
          name?: string
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_note: string | null
          created_at: string
          email: string
          id: number
          listing_id: number | null
          message: string
          name: string
          status: Database["public"]["Enums"]["contact_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          email: string
          id?: never
          listing_id?: number | null
          message: string
          name: string
          status?: Database["public"]["Enums"]["contact_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          email?: string
          id?: never
          listing_id?: number | null
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_archived: boolean
          buyer_id: string
          buyer_unread: number
          created_at: string
          id: number
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: number | null
          listing_title: string | null
          seller_archived: boolean
          seller_id: string
          seller_unread: number
        }
        Insert: {
          buyer_archived?: boolean
          buyer_id: string
          buyer_unread?: number
          created_at?: string
          id?: never
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: number | null
          listing_title?: string | null
          seller_archived?: boolean
          seller_id: string
          seller_unread?: number
        }
        Update: {
          buyer_archived?: boolean
          buyer_id?: string
          buyer_unread?: number
          created_at?: string
          id?: never
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: number | null
          listing_title?: string | null
          seller_archived?: boolean
          seller_id?: string
          seller_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      districts: {
        Row: {
          city_id: number
          created_at: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          city_id: number
          created_at?: string
          id?: never
          name: string
          slug: string
        }
        Update: {
          city_id?: number
          created_at?: string
          id?: never
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_listing_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "service_city_counts"
            referencedColumns: ["city_id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      identity_requests: {
        Row: {
          birth_year: number | null
          company_title: string | null
          created_at: string
          first_name: string | null
          id: number
          kind: Database["public"]["Enums"]["identity_kind"]
          last_name: string | null
          national_id: string | null
          nvi_checked_at: string | null
          nvi_result: boolean | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          tax_number: string | null
          tax_office: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          company_title?: string | null
          created_at?: string
          first_name?: string | null
          id?: never
          kind: Database["public"]["Enums"]["identity_kind"]
          last_name?: string | null
          national_id?: string | null
          nvi_checked_at?: string | null
          nvi_result?: boolean | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_year?: number | null
          company_title?: string | null
          created_at?: string
          first_name?: string | null
          id?: never
          kind?: Database["public"]["Enums"]["identity_kind"]
          last_name?: string | null
          national_id?: string | null
          nvi_checked_at?: string | null
          nvi_result?: boolean | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "identity_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      listing_credits: {
        Row: {
          created_at: string
          delta: number
          id: number
          listing_id: number | null
          order_id: number | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: never
          listing_id?: number | null
          order_id?: number | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: never
          listing_id?: number | null
          order_id?: number | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_credits_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_credits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          height: number | null
          id: number
          listing_id: number
          position: number
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: never
          listing_id: number
          position?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: never
          listing_id?: number
          position?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_promotions: {
        Row: {
          created_at: string
          ends_at: string
          id: number
          listing_id: number
          order_id: number | null
          promotion: Database["public"]["Enums"]["promotion_kind"]
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: never
          listing_id: number
          order_id?: number | null
          promotion: Database["public"]["Enums"]["promotion_kind"]
          starts_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: never
          listing_id?: number
          order_id?: number | null
          promotion?: Database["public"]["Enums"]["promotion_kind"]
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_promotions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_promotions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reports: {
        Row: {
          admin_note: string | null
          created_at: string
          id: number
          listing_id: number
          note: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: never
          listing_id: number
          note?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: never
          listing_id?: number
          note?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "listing_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      listing_videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          external_id: string | null
          height: number | null
          id: number
          listing_id: number
          playback_url: string | null
          position: number
          provider: Database["public"]["Enums"]["video_provider"]
          size_bytes: number | null
          status: Database["public"]["Enums"]["video_status"]
          storage_path: string | null
          thumbnail_path: string | null
          title: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          external_id?: string | null
          height?: number | null
          id?: never
          listing_id: number
          playback_url?: string | null
          position?: number
          provider?: Database["public"]["Enums"]["video_provider"]
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          external_id?: string | null
          height?: number | null
          id?: never
          listing_id?: number
          playback_url?: string | null
          position?: number
          provider?: Database["public"]["Enums"]["video_provider"]
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["video_status"]
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accepts_credit_card: boolean
          age_months: number | null
          allow_whatsapp: boolean
          breed_id: number | null
          breed_other: string | null
          category_id: number
          city_id: number
          color: string | null
          contact_count: number
          contact_phone: string | null
          created_at: string
          currency: string
          description: string
          details: Json
          district_id: number | null
          event_date: string | null
          expires_at: string | null
          favorite_count: number
          gender: Database["public"]["Enums"]["pet_gender"]
          has_health_report: boolean
          has_microchip: boolean
          has_pedigree: boolean
          has_warranty: boolean
          id: number
          is_dewormed_external: boolean
          is_dewormed_internal: boolean
          is_negotiable: boolean
          is_neutered: boolean
          is_reserved: boolean
          is_vaccinated: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          owner_account_type: Database["public"]["Enums"]["account_type"]
          owner_id: string
          phone_count: number
          price: number | null
          published_at: string | null
          quantity: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          search_vector: unknown
          ships_intercity: boolean
          show_phone: boolean
          size: Database["public"]["Enums"]["pet_size"] | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          view_count: number
          whatsapp_count: number
        }
        Insert: {
          accepts_credit_card?: boolean
          age_months?: number | null
          allow_whatsapp?: boolean
          breed_id?: number | null
          breed_other?: string | null
          category_id: number
          city_id: number
          color?: string | null
          contact_count?: number
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description: string
          details?: Json
          district_id?: number | null
          event_date?: string | null
          expires_at?: string | null
          favorite_count?: number
          gender?: Database["public"]["Enums"]["pet_gender"]
          has_health_report?: boolean
          has_microchip?: boolean
          has_pedigree?: boolean
          has_warranty?: boolean
          id?: never
          is_dewormed_external?: boolean
          is_dewormed_internal?: boolean
          is_negotiable?: boolean
          is_neutered?: boolean
          is_reserved?: boolean
          is_vaccinated?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          owner_account_type?: Database["public"]["Enums"]["account_type"]
          owner_id: string
          phone_count?: number
          price?: number | null
          published_at?: string | null
          quantity?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_vector?: unknown
          ships_intercity?: boolean
          show_phone?: boolean
          size?: Database["public"]["Enums"]["pet_size"] | null
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          view_count?: number
          whatsapp_count?: number
        }
        Update: {
          accepts_credit_card?: boolean
          age_months?: number | null
          allow_whatsapp?: boolean
          breed_id?: number | null
          breed_other?: string | null
          category_id?: number
          city_id?: number
          color?: string | null
          contact_count?: number
          contact_phone?: string | null
          created_at?: string
          currency?: string
          description?: string
          details?: Json
          district_id?: number | null
          event_date?: string | null
          expires_at?: string | null
          favorite_count?: number
          gender?: Database["public"]["Enums"]["pet_gender"]
          has_health_report?: boolean
          has_microchip?: boolean
          has_pedigree?: boolean
          has_warranty?: boolean
          id?: never
          is_dewormed_external?: boolean
          is_dewormed_internal?: boolean
          is_negotiable?: boolean
          is_neutered?: boolean
          is_reserved?: boolean
          is_vaccinated?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          owner_account_type?: Database["public"]["Enums"]["account_type"]
          owner_id?: string
          phone_count?: number
          price?: number | null
          published_at?: string | null
          quantity?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_vector?: unknown
          ships_intercity?: boolean
          show_phone?: boolean
          size?: Database["public"]["Enums"]["pet_size"] | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          view_count?: number
          whatsapp_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breed_listing_counts"
            referencedColumns: ["breed_id"]
          },
          {
            foreignKeyName: "listings_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_listing_counts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_listing_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "service_city_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "listings_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "listings_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: number
          created_at: string
          id: number
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: number
          created_at?: string
          id?: never
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: number
          created_at?: string
          id?: never
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: number
          listing_id: number | null
          order_id: number
          product_id: number
          quantity: number
          unit_price_minor: number
        }
        Insert: {
          created_at?: string
          id?: never
          listing_id?: number | null
          order_id: number
          product_id: number
          quantity?: number
          unit_price_minor: number
        }
        Update: {
          created_at?: string
          id?: never
          listing_id?: number | null
          order_id?: number
          product_id?: number
          quantity?: number
          unit_price_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_minor: number
          billing_snapshot: Json
          cancelled_at: string | null
          created_at: string
          currency: string
          id: number
          paid_at: string | null
          provider: string
          provider_ref: string | null
          public_ref: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_minor: number
          billing_snapshot?: Json
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          id?: never
          paid_at?: string | null
          provider?: string
          provider_ref?: string | null
          public_ref?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_minor?: number
          billing_snapshot?: Json
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          id?: never
          paid_at?: string | null
          provider?: string
          provider_ref?: string | null
          public_ref?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      page_content: {
        Row: {
          body: string | null
          breed_id: number | null
          category_id: number | null
          city_id: number | null
          created_at: string
          district_id: number | null
          faq: Json
          id: number
          intro: string | null
          seo_description: string | null
          seo_title: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          breed_id?: number | null
          category_id?: number | null
          city_id?: number | null
          created_at?: string
          district_id?: number | null
          faq?: Json
          id?: never
          intro?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          breed_id?: number | null
          category_id?: number | null
          city_id?: number | null
          created_at?: string
          district_id?: number | null
          faq?: Json
          id?: never
          intro?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_content_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breed_listing_counts"
            referencedColumns: ["breed_id"]
          },
          {
            foreignKeyName: "page_content_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_listing_counts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "page_content_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_content_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_listing_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "page_content_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "service_city_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "page_content_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: number
          order_id: number
          provider: string
          provider_ref: string | null
          raw_payload: Json
          status: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: never
          order_id: number
          provider: string
          provider_ref?: string | null
          raw_payload?: Json
          status: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: never
          order_id?: number
          provider?: string
          provider_ref?: string | null
          raw_payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: number
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: never
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: never
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          duration_days: number | null
          id: number
          is_active: boolean
          kind: Database["public"]["Enums"]["product_kind"]
          listing_credits: number | null
          name: string
          position: number
          price_minor: number
          promotion: Database["public"]["Enums"]["promotion_kind"] | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          id?: never
          is_active?: boolean
          kind: Database["public"]["Enums"]["product_kind"]
          listing_credits?: number | null
          name: string
          position?: number
          price_minor: number
          promotion?: Database["public"]["Enums"]["promotion_kind"] | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          id?: never
          is_active?: boolean
          kind?: Database["public"]["Enums"]["product_kind"]
          listing_credits?: number | null
          name?: string
          position?: number
          price_minor?: number
          promotion?: Database["public"]["Enums"]["promotion_kind"] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          city_id: number | null
          company_address: string | null
          company_title: string | null
          company_type: string | null
          created_at: string
          district_id: number | null
          full_name: string | null
          id: string
          identity_birth_year: number | null
          identity_kind: Database["public"]["Enums"]["identity_kind"] | null
          identity_rejected_reason: string | null
          identity_status: Database["public"]["Enums"]["verification_status"]
          identity_verified_at: string | null
          is_banned: boolean
          is_verified: boolean
          last_seen_at: string | null
          listing_count: number
          national_id: string | null
          phone: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          tax_number: string | null
          tax_office: string | null
          updated_at: string
          username: string | null
          verified_at: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          city_id?: number | null
          company_address?: string | null
          company_title?: string | null
          company_type?: string | null
          created_at?: string
          district_id?: number | null
          full_name?: string | null
          id: string
          identity_birth_year?: number | null
          identity_kind?: Database["public"]["Enums"]["identity_kind"] | null
          identity_rejected_reason?: string | null
          identity_status?: Database["public"]["Enums"]["verification_status"]
          identity_verified_at?: string | null
          is_banned?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          listing_count?: number
          national_id?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          username?: string | null
          verified_at?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          city_id?: number | null
          company_address?: string | null
          company_title?: string | null
          company_type?: string | null
          created_at?: string
          district_id?: number | null
          full_name?: string | null
          id?: string
          identity_birth_year?: number | null
          identity_kind?: Database["public"]["Enums"]["identity_kind"] | null
          identity_rejected_reason?: string | null
          identity_status?: Database["public"]["Enums"]["verification_status"]
          identity_verified_at?: string | null
          is_banned?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          listing_count?: number
          national_id?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          username?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_listing_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "service_city_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          id: number
          last_seen_at: string
          name: string
          params: Json
          path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          last_seen_at?: string
          name: string
          params?: Json
          path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          last_seen_at?: string
          name?: string
          params?: Json
          path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string
          filename: string
        }
        Insert: {
          applied_at?: string
          filename: string
        }
        Update: {
          applied_at?: string
          filename?: string
        }
        Relationships: []
      }
      service_features: {
        Row: {
          group_name: string
          id: number
          is_active: boolean
          name: string
          position: number
          service_type: Database["public"]["Enums"]["service_type"]
          slug: string
        }
        Insert: {
          group_name?: string
          id?: never
          is_active?: boolean
          name: string
          position?: number
          service_type: Database["public"]["Enums"]["service_type"]
          slug: string
        }
        Update: {
          group_name?: string
          id?: never
          is_active?: boolean
          name?: string
          position?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          slug?: string
        }
        Relationships: []
      }
      service_provider_features: {
        Row: {
          feature_id: number
          provider_id: number
        }
        Insert: {
          feature_id: number
          provider_id: number
        }
        Update: {
          feature_id?: number
          provider_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "service_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_features_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_hours: {
        Row: {
          closes_at: string | null
          is_24h: boolean
          is_closed: boolean
          opens_at: string | null
          provider_id: number
          weekday: number
        }
        Insert: {
          closes_at?: string | null
          is_24h?: boolean
          is_closed?: boolean
          opens_at?: string | null
          provider_id: number
          weekday: number
        }
        Update: {
          closes_at?: string | null
          is_24h?: boolean
          is_closed?: boolean
          opens_at?: string | null
          provider_id?: number
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_hours_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string | null
          city_id: number
          created_at: string
          description: string | null
          district_id: number | null
          email: string | null
          id: number
          is_verified: boolean
          latitude: number | null
          license_number: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          phone: string | null
          phone_alt: string | null
          phone_count: number
          published_at: string | null
          rating_average: number
          rating_count: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          search_vector: unknown
          service_type: Database["public"]["Enums"]["service_type"]
          slug: string
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
          verified_at: string | null
          view_count: number
          website: string | null
          whatsapp: string | null
          whatsapp_count: number
        }
        Insert: {
          address?: string | null
          city_id: number
          created_at?: string
          description?: string | null
          district_id?: number | null
          email?: string | null
          id?: never
          is_verified?: boolean
          latitude?: number | null
          license_number?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          phone_alt?: string | null
          phone_count?: number
          published_at?: string | null
          rating_average?: number
          rating_count?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_vector?: unknown
          service_type: Database["public"]["Enums"]["service_type"]
          slug: string
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          verified_at?: string | null
          view_count?: number
          website?: string | null
          whatsapp?: string | null
          whatsapp_count?: number
        }
        Update: {
          address?: string | null
          city_id?: number
          created_at?: string
          description?: string | null
          district_id?: number | null
          email?: string | null
          id?: never
          is_verified?: boolean
          latitude?: number | null
          license_number?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          phone_alt?: string | null
          phone_count?: number
          published_at?: string | null
          rating_average?: number
          rating_count?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_vector?: unknown
          service_type?: Database["public"]["Enums"]["service_type"]
          slug?: string
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          verified_at?: string | null
          view_count?: number
          website?: string | null
          whatsapp?: string | null
          whatsapp_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_listing_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "service_providers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "service_city_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "service_providers_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_providers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          is_published: boolean
          provider_id: number
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: never
          is_published?: boolean
          provider_id: number
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: never
          is_published?: boolean
          provider_id?: number
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          ends_at: string
          id: number
          is_active: boolean
          order_id: number | null
          product_id: number
          starts_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          ends_at: string
          id?: never
          is_active?: boolean
          order_id?: number | null
          product_id: number
          starts_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          ends_at?: string
          id?: never
          is_active?: boolean
          order_id?: number | null
          product_id?: number
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      active_listing_promotions: {
        Row: {
          last_ends_at: string | null
          listing_id: number | null
          promotions: Database["public"]["Enums"]["promotion_kind"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_promotions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      breed_listing_counts: {
        Row: {
          breed_id: number | null
          breed_name: string | null
          breed_slug: string | null
          category_id: number | null
          group_name: string | null
          listing_count: number | null
          position: number | null
        }
        Relationships: [
          {
            foreignKeyName: "breeds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_listing_counts"
            referencedColumns: ["category_id"]
          },
        ]
      }
      category_listing_counts: {
        Row: {
          category_id: number | null
          category_name: string | null
          category_slug: string | null
          listing_count: number | null
          position: number | null
        }
        Relationships: []
      }
      city_listing_counts: {
        Row: {
          city_id: number | null
          city_name: string | null
          city_slug: string | null
          listing_count: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          city_id: number | null
          company_title: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          listing_count: number | null
          username: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          city_id?: number | null
          company_title?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          listing_count?: number | null
          username?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          city_id?: number | null
          company_title?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          listing_count?: number | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "city_listing_counts"
            referencedColumns: ["city_id"]
          },
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "service_city_counts"
            referencedColumns: ["city_id"]
          },
        ]
      }
      seller_stats: {
        Row: {
          active_listings: number | null
          member_since: string | null
          total_listings: number | null
          user_id: string | null
        }
        Relationships: []
      }
      service_city_counts: {
        Row: {
          city_id: number | null
          city_name: string | null
          city_slug: string | null
          provider_count: number | null
          service_type: Database["public"]["Enums"]["service_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_list_users: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          account_type: string
          banned_reason: string
          company_title: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_banned: boolean
          is_verified: boolean
          last_sign_in_at: string
          listing_count: number
          listings_total: number
          phone: string
          role: string
          username: string
        }[]
      }
      admin_review_identity: {
        Args: { p_approve: boolean; p_reason?: string; p_request_id: number }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      confirm_order_payment: {
        Args: { p_provider_ref?: string; p_public_ref: string }
        Returns: undefined
      }
      counter_sync_active: { Args: never; Returns: boolean }
      create_order: {
        Args: {
          p_listing_id?: number
          p_product_code: string
          p_quantity?: number
        }
        Returns: string
      }
      delete_my_account: { Args: never; Returns: undefined }
      email_for_username: { Args: { p_username: string }; Returns: string }
      expire_listings: { Args: never; Returns: number }
      generate_username: { Args: { p_seed: string }; Returns: string }
      get_listing_contact: { Args: { p_listing_id: number }; Returns: string }
      guard_bypass: { Args: never; Returns: boolean }
      increment_listing_phone: {
        Args: { p_listing_id: number }
        Returns: undefined
      }
      increment_listing_view: {
        Args: { p_listing_id: number }
        Returns: undefined
      }
      increment_listing_whatsapp: {
        Args: { p_listing_id: number }
        Returns: undefined
      }
      increment_service_phone: {
        Args: { p_provider_id: number }
        Returns: undefined
      }
      increment_service_view: {
        Args: { p_provider_id: number }
        Returns: undefined
      }
      increment_service_whatsapp: {
        Args: { p_provider_id: number }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      mark_conversation_read: {
        Args: { p_conversation_id: number }
        Returns: undefined
      }
      monetization_enabled: { Args: never; Returns: boolean }
      normalize_tr_phone: { Args: { p_raw: string }; Returns: string }
      remaining_listing_credits: { Args: never; Returns: number }
      report_listing: {
        Args: { p_listing_id: number; p_note?: string; p_reason: string }
        Returns: undefined
      }
      saved_search_counts: {
        Args: never
        Returns: {
          id: number
          yeni_ilan: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      site_stats: {
        Args: never
        Returns: {
          listings_active: number
          members: number
          online_now: number
        }[]
      }
      start_conversation: { Args: { p_listing_id: number }; Returns: number }
      touch_last_seen: { Args: never; Returns: undefined }
      tr_slugify: { Args: { value: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
      unread_message_count: { Args: never; Returns: number }
      username_available: { Args: { p_username: string }; Returns: boolean }
    }
    Enums: {
      account_type: "bireysel" | "kurumsal"
      contact_status: "yeni" | "okundu" | "yanitlandi" | "kapatildi"
      identity_kind: "tc" | "vergi"
      listing_kind:
        | "satilik"
        | "sahiplendirme"
        | "kayip"
        | "bulundu"
        | "es_arayan"
      listing_status:
        | "taslak"
        | "onay_bekliyor"
        | "yayinda"
        | "reddedildi"
        | "pasif"
        | "suresi_doldu"
        | "satildi"
      order_status:
        | "odeme_bekleniyor"
        | "odendi"
        | "iptal"
        | "basarisiz"
        | "iade"
      pet_gender: "erkek" | "disi" | "belirtilmemis"
      pet_size: "mini" | "kucuk" | "orta" | "buyuk" | "dev"
      product_kind: "doping" | "abonelik" | "ilan_paketi"
      promotion_kind:
        | "anasayfa_vitrin"
        | "kategori_vitrin"
        | "ust_sirada"
        | "acil"
        | "renkli_cerceve"
        | "ilan_yenileme"
        | "video"
      report_reason:
        | "yaniltici"
        | "dolandiricilik"
        | "yasakli_tur"
        | "kotu_muamele"
        | "yanlis_kategori"
        | "tekrar_ilan"
        | "diger"
      report_status: "acik" | "inceleniyor" | "kapatildi" | "reddedildi"
      service_status:
        | "taslak"
        | "onay_bekliyor"
        | "yayinda"
        | "reddedildi"
        | "pasif"
      service_type:
        | "veteriner"
        | "pet_oteli"
        | "kuafor"
        | "pet_taksi"
        | "gezdirici"
        | "egitmen"
        | "petshop"
      user_role: "user" | "moderator" | "admin"
      verification_status: "yok" | "inceleniyor" | "dogrulandi" | "reddedildi"
      video_provider: "supabase" | "cloudflare" | "bunny"
      video_status: "yukleniyor" | "isleniyor" | "hazir" | "basarisiz"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["bireysel", "kurumsal"],
      contact_status: ["yeni", "okundu", "yanitlandi", "kapatildi"],
      identity_kind: ["tc", "vergi"],
      listing_kind: [
        "satilik",
        "sahiplendirme",
        "kayip",
        "bulundu",
        "es_arayan",
      ],
      listing_status: [
        "taslak",
        "onay_bekliyor",
        "yayinda",
        "reddedildi",
        "pasif",
        "suresi_doldu",
        "satildi",
      ],
      order_status: [
        "odeme_bekleniyor",
        "odendi",
        "iptal",
        "basarisiz",
        "iade",
      ],
      pet_gender: ["erkek", "disi", "belirtilmemis"],
      pet_size: ["mini", "kucuk", "orta", "buyuk", "dev"],
      product_kind: ["doping", "abonelik", "ilan_paketi"],
      promotion_kind: [
        "anasayfa_vitrin",
        "kategori_vitrin",
        "ust_sirada",
        "acil",
        "renkli_cerceve",
        "ilan_yenileme",
        "video",
      ],
      report_reason: [
        "yaniltici",
        "dolandiricilik",
        "yasakli_tur",
        "kotu_muamele",
        "yanlis_kategori",
        "tekrar_ilan",
        "diger",
      ],
      report_status: ["acik", "inceleniyor", "kapatildi", "reddedildi"],
      service_status: [
        "taslak",
        "onay_bekliyor",
        "yayinda",
        "reddedildi",
        "pasif",
      ],
      service_type: [
        "veteriner",
        "pet_oteli",
        "kuafor",
        "pet_taksi",
        "gezdirici",
        "egitmen",
        "petshop",
      ],
      user_role: ["user", "moderator", "admin"],
      verification_status: ["yok", "inceleniyor", "dogrulandi", "reddedildi"],
      video_provider: ["supabase", "cloudflare", "bunny"],
      video_status: ["yukleniyor", "isleniyor", "hazir", "basarisiz"],
    },
  },
} as const

