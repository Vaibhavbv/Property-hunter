import Link from "next/link";
import { ENABLED_SOURCES } from "@/config/sources";
import type { PropertyFilters } from "@/lib/queries";

const inputClass =
  "rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900";

/**
 * Filter bar. It's a plain GET form so the active filters live in the URL —
 * shareable, bookmarkable, and server-rendered with no client JS.
 */
export function Filters({
  cities,
  active,
}: {
  cities: string[];
  active: PropertyFilters & { view?: "new" | "all" };
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">View</label>
        <select name="view" defaultValue={active.view ?? "new"} className={inputClass}>
          <option value="new">New today</option>
          <option value="all">All listings</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">City</label>
        <select name="city" defaultValue={active.city ?? ""} className={inputClass}>
          <option value="">Any</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Type</label>
        <select name="transaction" defaultValue={active.transaction ?? ""} className={inputClass}>
          <option value="">Rent or sale</option>
          <option value="rent">Rent</option>
          <option value="sale">Sale</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Source</label>
        <select name="source" defaultValue={active.source ?? ""} className={inputClass}>
          <option value="">All sources</option>
          {ENABLED_SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Min BHK</label>
        <input
          type="number"
          name="minBhk"
          min={0}
          defaultValue={active.minBhk ?? ""}
          className={`${inputClass} w-20`}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Max price (₹)</label>
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={active.maxPrice ?? ""}
          className={`${inputClass} w-32`}
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Apply
      </button>
      <Link
        href="/"
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        Reset
      </Link>
    </form>
  );
}
