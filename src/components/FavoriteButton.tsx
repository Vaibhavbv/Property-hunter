"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions";

export function FavoriteButton({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={fav ? "Remove from shortlist" : "Add to shortlist"}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !fav;
        setFav(next);
        startTransition(() => toggleFavorite(propertyId, next));
      }}
      className="rounded-full bg-white/90 px-2 py-1 text-lg leading-none shadow hover:scale-110 transition disabled:opacity-50"
    >
      {fav ? "★" : "☆"}
    </button>
  );
}
