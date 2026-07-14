import type { PropertyRow } from "@/lib/types";

/** Format a rupee amount into a compact Indian-style label. */
export function formatPrice(row: Pick<PropertyRow, "price" | "price_period">): string {
  const { price, price_period } = row;
  if (price == null) return "Price on request";

  let label: string;
  if (price >= 1_00_00_000) label = `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
  else if (price >= 1_00_000) label = `₹${(price / 1_00_000).toFixed(2)} L`;
  else label = `₹${price.toLocaleString("en-IN")}`;

  return price_period === "month" ? `${label}/mo` : label;
}

export function relativeDay(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function isNew(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}
