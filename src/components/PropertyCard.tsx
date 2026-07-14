import Link from "next/link";
import type { PropertyRow } from "@/lib/types";
import { formatPrice, isNew, relativeDay } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SOURCES } from "@/config/sources";

export function PropertyCard({
  property,
  isFavorite,
}: {
  property: PropertyRow;
  isFavorite: boolean;
}) {
  const img = property.images?.[0];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        {isNew(property.first_seen_at) && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
            NEW
          </span>
        )}
        <FavoriteButton propertyId={property.id} initial={isFavorite} />
      </div>

      <Link href={`/property/${property.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250'><rect width='100%' height='100%' fill='%23e5e7eb'/></svg>"}
          alt={property.title ?? "Property"}
          className="h-44 w-full object-cover"
        />
        <div className="p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-bold text-brand">
              {formatPrice(property)}
            </span>
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {property.transaction_type}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-1 text-sm font-medium">
            {property.title ?? "Untitled listing"}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
            {[property.locality, property.city].filter(Boolean).join(", ")}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {SOURCES[property.source]?.label ?? property.source} ·{" "}
              {relativeDay(property.first_seen_at)}
            </span>
            {property.bhk != null && <span>{property.bhk} BHK</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}
