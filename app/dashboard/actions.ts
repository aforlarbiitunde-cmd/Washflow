'use server';
import { revalidatePath } from 'next/cache';
import { createHash, randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';


async function workspace() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect('/login');
 const { data: business, error } = await supabase.from('businesses').select('id,name').limit(1).maybeSingle();
 if (error || !business) throw new Error('Your business workspace is not ready yet.');
 return { supabase, user, business };
}
export async function addCustomer(formData: FormData) {
 const { supabase, business } = await workspace();
 const name = String(formData.get('full_name')||'').trim();
 const phone = String(formData.get('phone')||'').trim();
 if (!name || name.length > 160 || phone.length > 30) redirect('/dashboard/customers?error=Check+customer+details');
 const { error } = await supabase.from('customers').insert({business_id:business.id,full_name:name,phone:phone||null});
 if (error) redirect('/dashboard/customers?error=Customer+could+not+be+saved');
 revalidatePath('/dashboard'); revalidatePath('/dashboard/customers'); redirect('/dashboard/customers?success=Customer+added');
}
export async function addVehicle(formData: FormData) {
 const { supabase, business } = await workspace();
 const customerId=String(formData.get('customer_id')||'');
 const plate=String(formData.get('plate')||'').trim().toUpperCase();
 const make=String(formData.get('make')||'').trim(); const model=String(formData.get('model')||'').trim();
 if (!customerId || !plate || plate.length>24) redirect('/dashboard/customers?error=Vehicle+details+required');
 const {error}=await supabase.from('vehicles').insert({business_id:business.id,customer_id:customerId,plate,make:make||null,model:model||null});
 if(error) redirect('/dashboard/customers?error=Vehicle+could+not+be+saved');
 revalidatePath('/dashboard/customers'); redirect('/dashboard/customers?success=Vehicle+added');
}
export async function recordWash(formData: FormData) {
 const { supabase, business, user }=await workspace();
 const service=String(formData.get('service_name')||'').trim();
 const amount=Number(formData.get('amount'));
 const method=String(formData.get('payment_method')||'cash');
 const customerId=String(formData.get('customer_id')||'')||null;
 const vehicleId=String(formData.get('vehicle_id')||'')||null;
 if(!service||service.length>100||!Number.isFinite(amount)||amount<0||amount>100000||!['cash','card','bank_transfer','online','membership','other'].includes(method)) redirect('/dashboard/sales?error=Invalid+sale+details');
 const {error}=await supabase.from('wash_transactions').insert({business_id:business.id,customer_id:customerId,vehicle_id:vehicleId,service_name:service,amount,payment_method:method,staff_user_id:user.id});
 if(error) redirect('/dashboard/sales?error=Transaction+could+not+be+recorded');
 revalidatePath('/dashboard'); revalidatePath('/dashboard/sales'); redirect('/dashboard/sales?success=Wash+recorded');
}
export async function createMembership(_prev: {error?:string; token?:string; message?:string}|null, formData: FormData) {
 const {supabase,business}=await workspace();
 const customerId=String(formData.get('customer_id')||''); const plan=String(formData.get('plan_name')||'').trim();
 const washesRaw=String(formData.get('washes')||''); const washes=washesRaw?Number(washesRaw):null;
 const duration=Number(formData.get('duration_days')||30);
 if(!customerId||!plan||plan.length>100||!Number.isInteger(duration)||duration<1||duration>365|| (washes!==null&&(!Number.isInteger(washes)||washes<1||washes>1000))) return {error:'Check membership details and try again.'};
 const start=new Date(); const expiry=new Date(start.getTime()+duration*86400000);
 const token=randomBytes(32).toString('base64url'); const tokenHash=createHash('sha256').update(token).digest('hex');
 const {error}=await supabase.from('memberships').insert({business_id:business.id,customer_id:customerId,plan_name:plan,starts_at:start.toISOString(),expires_at:expiry.toISOString(),remaining_washes:washes,qr_token_hash:tokenHash});
 if(error) return {error:'Membership could not be created. Check the selected customer and try again.'};
 revalidatePath('/dashboard/memberships');
 return {token,message:'Membership created. Save this token; it is only shown now.'};
}
export async function redeemMembership(_prev:{error?:string;result?:string}|null,formData:FormData){
 const {supabase}=await workspace(); const token=String(formData.get('token')||'').trim();
 if(token.length<32||token.length>512) return {error:'Enter a valid membership token.'};
 const {data,error}=await supabase.rpc('redeem_membership_token',{token});
 if(error) return {error:error.message.replace(/^.*?: /,'')};
 revalidatePath('/dashboard/memberships'); revalidatePath('/dashboard');
 const redemption=data?.[0]; return {result:`Redemption successful. ${redemption?.remaining_washes===null?'Unlimited membership':`${redemption?.remaining_washes} washes remaining`}.`};
}
