'use server';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || email.length > 254) redirect("/forgot-password?error=Enter+a+valid+email+address.");

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = new URL("/auth/callback?next=/update-password", siteUrl).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Use a generic message to avoid disclosing whether an email has an account.
  if (error) redirect("/forgot-password?error=Unable+to+send+the+reset+email.+Please+try+again+later.");
  redirect("/forgot-password?success=When+an+account+matches+that+email,+a+reset+link+will+be+sent.");
}
