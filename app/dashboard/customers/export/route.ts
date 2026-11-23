import {createClient} from '@/lib/supabase/server';
const csv=(v:unknown)=>{const s=String(v??'');return `"${s.replaceAll('"','""')}"`;};
export async function GET(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return new Response('Unauthorized',{status:401});
 const rows:any[]=[];for(let from=0;from<10000;from+=1000){const {data,error}=await supabase.from('customers').select('full_name,phone,created_at,vehicles(plate,make,model,color)').order('created_at',{ascending:false}).range(from,from+999);if(error)return new Response('Export failed',{status:500});rows.push(...(data||[]));if(!data||data.length<1000)break;}
 const header=['Customer name','Phone','Vehicle plate','Make','Model','Color','Created at'];const lines=[header.map(csv).join(',')];for(const c of rows){const cars=c.vehicles?.length?c.vehicles:[null];for(const v of cars)lines.push([c.full_name,c.phone,v?.plate,v?.make,v?.model,v?.color,c.created_at].map(csv).join(','));}
 return new Response('\uFEFF'+lines.join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="washflow-customers.csv"','Cache-Control':'no-store'}});
}
