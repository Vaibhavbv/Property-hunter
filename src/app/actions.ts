"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function toggleFavorite(propertyId: string, makeFavorite: boolean) {
  const db = createServerSupabase();
  if (makeFavorite) {
    await db.from("favorites").upsert({ property_id: propertyId });
  } else {
    await db.from("favorites").delete().eq("property_id", propertyId);
  }
  revalidatePath("/");
  revalidatePath(`/property/${propertyId}`);
}

export async function signOut() {
  const db = createServerSupabase();
  await db.auth.signOut();
  redirect("/login");
}
