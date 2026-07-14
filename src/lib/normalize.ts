import type {
  NormalizedListing,
  PostedBy,
  PricePeriod,
  SourceKey,
  TransactionType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Small, defensive parsing helpers. Actor output is messy and inconsistent
// across portals, so every field is treated as best-effort.
// ---------------------------------------------------------------------------

export function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Parse an Indian price string like "₹ 25,000/month" or "1.2 Cr" into a number of rupees. */
export function parsePrice(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = toStr(v);
  if (!s) return null;

  const lower = s.toLowerCase().replace(/,/g, "");
  const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num)) return null;

  if (lower.includes("cr")) return Math.round(num * 1_00_00_000);
  if (lower.includes("lac") || lower.includes("lakh") || lower.includes("l "))
    return Math.round(num * 1_00_000);
  return Math.round(num);
}

export function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = toStr(v);
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Extract a BHK count from strings like "2 BHK Apartment". */
export function parseBhk(v: unknown): number | null {
  const s = toStr(v);
  if (!s) return null;
  const m = s.match(/(\d+)\s*bhk/i) ?? s.match(/(\d+)\s*bed/i);
  return m ? parseInt(m[1], 10) : null;
}

export function parseTransaction(v: unknown): TransactionType | null {
  const s = toStr(v)?.toLowerCase();
  if (!s) return null;
  if (s.includes("rent") || s.includes("lease")) return "rent";
  if (s.includes("sale") || s.includes("sell") || s.includes("buy"))
    return "sale";
  return null;
}

export function pricePeriodFor(txn: TransactionType | null): PricePeriod | null {
  if (txn === "rent") return "month";
  if (txn === "sale") return "total";
  return null;
}

/**
 * Decide whether a listing was posted by an owner or a broker. Portals expose
 * this differently; we check the common fields plus obvious text signals.
 */
export function classifyPostedBy(raw: Record<string, unknown>): PostedBy {
  const candidates = [
    raw.postedBy,
    raw.posted_by,
    raw.dealerType,
    raw.sellerType,
    raw.userType,
    raw.ownerType,
    raw.listedBy,
  ]
    .map((v) => toStr(v)?.toLowerCase())
    .filter(Boolean) as string[];

  const joined = candidates.join(" ");
  if (/owner|individual/.test(joined)) return "owner";
  if (/broker|agent|dealer|builder/.test(joined)) return "broker";
  return "unknown";
}

export function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map((x) => toStr(x)).filter((x): x is string => Boolean(x));
  }
  const s = toStr(v);
  return s ? [s] : [];
}

/** Build a stable dedup id from whatever the actor gives us. */
export function deriveListingId(
  raw: Record<string, unknown>,
  url: string | null
): string {
  const id =
    toStr(raw.id) ??
    toStr(raw.listingId) ??
    toStr(raw.propertyId) ??
    toStr(raw.adId);
  if (id) return id;
  if (url) return url;
  // Last resort: hash the JSON so at least identical payloads dedupe.
  return `hash_${simpleHash(JSON.stringify(raw))}`;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/**
 * Generic mapper used by all adapters. Adapters pass the source key and the
 * field names for their particular actor; anything not provided falls back to
 * the common field names above.
 */
export function normalizeCommon(
  source: SourceKey,
  raw: Record<string, unknown>,
  overrides: Partial<NormalizedListing> = {}
): NormalizedListing {
  const url =
    overrides.url ??
    toStr(raw.url) ??
    toStr(raw.link) ??
    toStr(raw.detailUrl) ??
    toStr(raw.propertyUrl) ??
    toStr(raw.pageUrl);
  const txn =
    overrides.transaction_type ??
    parseTransaction(raw.transactionType ?? raw.type ?? raw.category) ??
    // Fall back to inferring rent/sale from the listing URL itself.
    parseTransaction(url);

  return {
    source,
    source_listing_id:
      overrides.source_listing_id ?? deriveListingId(raw, url ?? null),
    url: url ?? "",
    title: overrides.title ?? toStr(raw.title ?? raw.name ?? raw.heading),
    description:
      overrides.description ?? toStr(raw.description ?? raw.summary),
    transaction_type: txn,
    property_type:
      overrides.property_type ??
      toStr(raw.propertyType ?? raw.subType ?? raw.category),
    price:
      overrides.price ??
      parsePrice(raw.price ?? raw.amount ?? raw.rent ?? raw.priceValue),
    price_period: overrides.price_period ?? pricePeriodFor(txn),
    bhk:
      overrides.bhk ??
      parseBhk(raw.bhk ?? raw.title ?? raw.configuration ?? raw.bedrooms),
    area_sqft:
      overrides.area_sqft ??
      parseNumber(raw.area ?? raw.carpetArea ?? raw.size ?? raw.sqft),
    city: overrides.city ?? toStr(raw.city ?? raw.location ?? raw.address),
    locality:
      overrides.locality ?? toStr(raw.locality ?? raw.area_name ?? raw.subLocality),
    latitude: overrides.latitude ?? parseNumber(raw.latitude ?? raw.lat),
    longitude: overrides.longitude ?? parseNumber(raw.longitude ?? raw.lng ?? raw.lon),
    posted_by: overrides.posted_by ?? classifyPostedBy(raw),
    owner_name:
      overrides.owner_name ??
      toStr(
        raw.ownerName ?? raw.contactName ?? raw.postedByName ?? raw.sellerName
      ),
    owner_contact:
      overrides.owner_contact ??
      toStr(raw.phone ?? raw.contact ?? raw.mobile ?? raw.contactNumber),
    images:
      overrides.images ??
      toStringArray(
        raw.images ?? raw.photos ?? raw.imageUrls ?? raw.gallery ?? raw.imageUrl
      ),
    amenities: overrides.amenities ?? toStringArray(raw.amenities ?? raw.features),
    raw,
  };
}
