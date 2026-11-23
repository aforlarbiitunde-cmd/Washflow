import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
export default async function Dashboard() {
 const supabase=await createClient();
 const {data:business}=await supabase.from('businesses').select('id,name,country').limit(1).maybeSingle();
 const todayStart=new Date(); todayStart.setHours(0,0,0,0);
 const [customers,washes,transactions,memberships]=await Promise.all([
  supabase.from('customers').select('id',{count:'exact',head:true}),
  supabase.from('wash_transactions').select('id',{count:'exact',head:true}).gte('created_at',todayStart.toISOString()),
  supabase.from('wash_transactions').select('amount').gte('created_at',todayStart.toISOString()),
  supabase.from('memberships').select('id',{count:'exact',head:true}).eq('status','active')
 ]);
 const revenue=(transactions.data||[]).reduce((s,r)=>s+Number(r.amount||0),0);
 return <><header className="page-header"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>{business?.name||'Business dashboard'}</h1><p className="muted">Your daily wash operation at a glance.</p></div><Link className="btn" href="/dashboard/sales">＋ Record wash</Link></header>
 <div className="metric-grid"><div className="metric"><span>Customers</span><strong>{customers.count??0}</strong><small>Total registered</small></div><div className="metric"><span>Washes today</span><strong>{washes.count??0}</strong><small>Transactions logged</small></div><div className="metric"><span>Revenue today</span><strong>OMR {revenue.toFixed(3)}</strong><small>Recorded sales</small></div><div className="metric"><span>Active memberships</span><strong>{memberships.count??0}</strong><small>Current active plans</small></div></div>
 <section className="panel"><h2>Quick actions</h2><div className="quick-grid"><Link className="quick-action" href="/dashboard/customers"><b>＋ Add customer</b><span>Customer and vehicle records</span></Link><Link className="quick-action" href="/dashboard/sales"><b>＋ Record a wash</b><span>Record a service and payment</span></Link><Link className="quick-action" href="/dashboard/memberships"><b>＋ Create membership</b><span>Start a VIP wash plan</span></Link></div></section>
 <section className="panel"><h2>Getting started</h2><p className="muted">Add customers, record every wash, and create membership plans. Reports will become more useful as your business builds transaction history.</p></section></>;
}
