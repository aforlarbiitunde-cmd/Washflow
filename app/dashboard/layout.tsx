import Link from 'next/link';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export default async function DashboardLayout({children}:{children:ReactNode}) {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login');
 const {data:admin}=await supabase.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 const nav=[['Overview','/dashboard'],['Customers','/dashboard/customers'],['Sales / POS','/dashboard/sales'],['Memberships','/dashboard/memberships'],['Reports','/dashboard/reports']];
 return <div className="app-shell"><aside className="sidebar"><Link href="/" className="brand">WashFlow<span className="brand-dot">.</span></Link><div className="nav-label">WORKSPACE</div>{nav.map(([label,url])=><Link href={url} className="side-link" key={url}>{label}</Link>)}{admin&&<Link href="/admin" className="side-link admin-link">Platform Admin</Link>}<div className="sidebar-bottom"><span className="muted small">Signed in</span><div className="user-email">{user.email}</div><form action="/logout" method="post"><button className="btn secondary full">Log out</button></form></div></aside><main className="app-main">{children}</main></div>
}
