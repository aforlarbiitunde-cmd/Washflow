'use server';

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirm_password") || "");
  if (password.length < 12 || password !== confirmation) {
    redirect("/update-password?error=Passwords+must+match+and+be+at+least+12+characters.");
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login?error=Your+password+reset+link+is+invalid+or+has+expired.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/update-password?error=Password+could+not+be+updated.+Request+a+new+reset+link.");
  redirect("/login?message=Password+updated.+Please+log+in.");
}
