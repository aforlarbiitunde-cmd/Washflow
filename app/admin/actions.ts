'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function updateBusinessStatus(formData:FormData){
 const id=String(formData.get('business_id')||'');const status=String(formData.get('status')||'');
 if(!id||!['active','suspended','pending'].includes(status))redirect('/admin?error=Invalid+business+status');
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/login');
 const {error}=await supabase.rpc('admin_set_business_status',{target_business:id,new_status:status});
 if(error)redirect('/admin?error=Admin+operation+failed'); revalidatePath('/admin');redirect('/admin?success=Status+updated');
}
export async function updateBusinessPlan(formData:FormData){
 const id=String(formData.get('business_id')||'');const plan=String(formData.get('plan')||'');const price=Number(formData.get('price')||0);
 if(!id||!['trial','starter','growth','pro'].includes(plan)||!Number.isFinite(price)||price<0||price>10000)redirect('/admin?error=Invalid+plan+details');
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/login');
 const {error}=await supabase.rpc('admin_set_business_plan',{target_business:id,new_plan:plan,new_price:price});
 if(error)redirect('/admin?error=Plan+change+failed');revalidatePath('/admin');redirect('/admin?success=Plan+updated');
}
