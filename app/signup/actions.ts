'use server';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const businessName = String(formData.get("business_name") || "").trim();
  const ownerName = String(formData.get("owner_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const password = String(formData.get("password") || "");
  const termsAccepted = formData.get("terms") === "on";

  if (!termsAccepted || !businessName || businessName.length > 120 || !ownerName || ownerName.length > 120 ||
      !email || email.length > 254 || !phone || phone.length > 30 || !country || country.length > 80 || password.length < 12) {
    redirect("/signup?error=Please+check+your+details.+Password+must+be+at+least+12+characters.");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
      data: {
        business_name: businessName,
        owner_name: ownerName,
        phone,
        country,
      },
    },
  });

  // Avoid exposing account-existence or other sensitive Auth details.
  if (error) redirect("/signup?error=Registration+could+not+be+completed.+Check+your+details+or+try+again+later.");
  redirect("/signup?success=Account+created.+Check+your+email+to+verify+your+address.");
}
