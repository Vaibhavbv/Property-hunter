// Shared domain types for the ingestion pipeline and the UI.

export type SourceKey = "99acres" | "magicbricks" | "housing" | "nobroker";

export type TransactionType = "rent" | "sale";
export type PricePeriod = "month" | "total";
export type PostedBy = "owner" | "broker" | "unknown";

/**
 * The normalized shape we store in the `properties` table. Every source
 * adapter maps its raw actor output into this shape via `normalize.ts`.
 */
export interface NormalizedListing {
  source: SourceKey;
  source_listing_id: string;
  url: string;
  title: string | null;
  description: string | null;
  transaction_type: TransactionType | null;
  property_type: string | null;
  price: number | null;
  price_period: PricePeriod | null;
  bhk: number | null;
  area_sqft: number | null;
  city: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  posted_by: PostedBy;
  owner_name: string | null;
  owner_contact: string | null;
  images: string[];
  amenities: string[];
  raw: unknown;
}

/** A row as read back from Supabase for display. */
export interface PropertyRow extends NormalizedListing {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
}
