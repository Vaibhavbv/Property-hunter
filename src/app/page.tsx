import Link from "next/link";
import { Filters } from "@/components/Filters";
import { PropertyCard } from "@/components/PropertyCard";
import { signOut } from "@/app/actions";
import {
  fetchCities,
  fetchFavoriteIds,
  fetchProperties,
  type PropertyFilters,
} from "@/lib/queries";
import type { SourceKey, TransactionType } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseFilters(sp: Record<string, string | undefined>): PropertyFilters {
  return {
    view: sp.view === "all" ? "all" : "new",
    city: sp.city || undefined,
    transaction: (sp.transaction as TransactionType) || undefined,
    source: (sp.source as SourceKey) || undefined,
    minBhk: sp.minBhk ? Number(sp.minBhk) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    favoritesOnly: sp.favorites === "1",
  };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const [properties, cities, favIds] = await Promise.all([
    fetchProperties(filters),
    fetchCities(),
    fetchFavoriteIds(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🏠 Property Hunter</h1>
          <p className="text-sm text-gray-500">
            Owner-posted listings, refreshed daily.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/?favorites=1" className="text-brand hover:underline">
            ★ Shortlist
          </Link>
          <form action={signOut}>
            <button className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <Filters cities={cities} active={filters} />
      </div>

      {filters.favoritesOnly && (
        <p className="mb-4 text-sm text-gray-500">
          Showing your shortlist ·{" "}
          <Link href="/" className="text-brand hover:underline">
            back to all
          </Link>
        </p>
      )}

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700">
          <p className="font-medium">No listings match.</p>
          <p className="mt-1 text-sm">
            {filters.view === "new"
              ? "No new listings in the last 24h — try “All listings”, or run the daily scrape."
              : "Run the scraper to populate listings (see README)."}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            {properties.length} listing{properties.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isFavorite={favIds.has(p.id)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
