import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchFavoriteIds, fetchProperty } from "@/lib/queries";
import { formatPrice, relativeDay } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SOURCES } from "@/config/sources";

export const dynamic = "force-dynamic";

export default async function PropertyDetail({
  params,
}: {
  params: { id: string };
}) {
  const property = await fetchProperty(params.id);
  if (!property) notFound();

  const favIds = await fetchFavoriteIds();
  const mapUrl =
    property.latitude != null && property.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
      : property.locality
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [property.locality, property.city].filter(Boolean).join(", ")
        )}`
      : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/" className="text-sm text-brand hover:underline">
        ← Back to listings
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{property.title ?? "Listing"}</h1>
          <p className="mt-1 text-gray-500">
            {[property.locality, property.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <FavoriteButton propertyId={property.id} initial={favIds.has(property.id)} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-bold text-brand">
        {formatPrice(property)}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {property.transaction_type}
        </span>
      </div>

      {property.images?.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {property.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Photo ${i + 1}`}
              className="h-40 w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label="BHK" value={property.bhk != null ? `${property.bhk}` : "—"} />
        <Fact
          label="Area"
          value={property.area_sqft != null ? `${property.area_sqft} sqft` : "—"}
        />
        <Fact label="Type" value={property.property_type ?? "—"} />
        <Fact label="Posted by" value={property.posted_by} />
      </dl>

      {property.description && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
            {property.description}
          </p>
        </section>
      )}

      {property.amenities?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Amenities</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <li
                key={a}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800"
              >
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Owner contact</h2>
        <p className="mt-1 text-sm">
          {property.owner_name && <span className="font-medium">{property.owner_name}</span>}
          {property.owner_contact ? (
            <span className="ml-2">{property.owner_contact}</span>
          ) : (
            <span className="ml-2 text-gray-500">
              Contact shown on the source listing
            </span>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a
            href={property.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
          >
            View on {SOURCES[property.source]?.label ?? property.source} ↗
          </a>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Open in Maps ↗
            </a>
          )}
        </div>
      </section>

      <p className="mt-4 text-xs text-gray-400">
        First seen {relativeDay(property.first_seen_at)}
      </p>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
