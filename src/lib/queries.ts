import { createServerSupabase } from "@/lib/supabase/server";
import type { PropertyRow, SourceKey, TransactionType } from "@/lib/types";

export interface PropertyFilters {
  view?: "new" | "all";
  city?: string;
  transaction?: TransactionType;
  source?: SourceKey;
  minBhk?: number;
  maxPrice?: number;
  favoritesOnly?: boolean;
}

const PAGE_SIZE = 60;

/** Fetch listings for the dashboard, applying the active filters. */
export async function fetchProperties(
  filters: PropertyFilters
): Promise<PropertyRow[]> {
  const db = createServerSupabase();

  let query = db
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .order("first_seen_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (filters.view === "new") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("first_seen_at", since);
  }
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.transaction) query = query.eq("transaction_type", filters.transaction);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.minBhk) query = query.gte("bhk", filters.minBhk);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);

  if (filters.favoritesOnly) {
    const { data: favs } = await db.from("favorites").select("property_id");
    const ids = (favs ?? []).map((f) => f.property_id as string);
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PropertyRow[];
}

export async function fetchProperty(id: string): Promise<PropertyRow | null> {
  const db = createServerSupabase();
  const { data } = await db.from("properties").select("*").eq("id", id).single();
  return (data as PropertyRow) ?? null;
}

export async function fetchFavoriteIds(): Promise<Set<string>> {
  const db = createServerSupabase();
  const { data } = await db.from("favorites").select("property_id");
  return new Set((data ?? []).map((f) => f.property_id as string));
}

/** Distinct cities present in the data, for the filter dropdown. */
export async function fetchCities(): Promise<string[]> {
  const db = createServerSupabase();
  const { data } = await db
    .from("properties")
    .select("city")
    .not("city", "is", null)
    .limit(1000);
  const set = new Set(
    (data ?? []).map((r) => r.city as string).filter(Boolean)
  );
  return Array.from(set).sort();
}
