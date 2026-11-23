import {createClient} from '@/lib/supabase/server';
const csv=(v:unknown)=>{const s=String(v??'');return `"${s.replaceAll('"','""')}"`;};
export async function GET(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return new Response('Unauthorized',{status:401});
 const rows:any[]=[];for(let from=0;from<10000;from+=1000){const {data,error}=await supabase.from('wash_transactions').select('created_at,service_name,amount,payment_method,customers(full_name),vehicles(plate,make,model)').order('created_at',{ascending:false}).range(from,from+999);if(error)return new Response('Export failed',{status:500});rows.push(...(data||[]));if(!data||data.length<1000)break;}
 const header=['Date/time','Service','Customer','Plate','Vehicle','Payment','Amount OMR'];const lines=[header.map(csv).join(',')];for(const t of rows){const c=t.customers as any,v=t.vehicles as any;lines.push([t.created_at,t.service_name,c?.full_name,v?.plate,[v?.make,v?.model].filter(Boolean).join(' '),t.payment_method,Number(t.amount).toFixed(3)].map(csv).join(','));}
 return new Response('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="washflow-sales.csv"','Cache-Control':'no-store'}});
}
