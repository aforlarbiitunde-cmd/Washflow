import Link from "next/link";
export default function Home() {
 return <main className="container">
  <nav className="nav"><div className="brand">🚘 WashFlow</div><div><Link href="/login">Log in</Link> &nbsp; <Link className="btn" href="/signup">Start your business</Link></div></nav>
  <section className="hero">
   <span className="pill">Built for independent car wash businesses</span>
   <h1>Run your car wash.<br/><span style={{color:"#21c58b"}}>Not your paperwork.</span></h1>
   <p className="muted" style={{fontSize:19,maxWidth:650,lineHeight:1.6}}>Customers, vehicles, wash sales, memberships and daily operations—organized in one simple mobile-friendly workspace.</p>
   <p style={{marginTop:28}}><Link className="btn" href="/signup">Create your business account →</Link> &nbsp; <Link className="btn secondary" href="/login">Existing customer login</Link></p>
  </section>
  <section className="grid">
   {["Customer & vehicle records","Memberships and QR check-in","Sales and daily reports","Team access and permissions"].map((feature)=><article className="panel" key={feature}><h3>{feature}</h3><p className="muted">Designed to be easy on a phone and practical for day-to-day car wash operations.</p></article>)}
  </section>
  <footer className="muted" style={{padding:"50px 0"}}>WashFlow · Early access</footer>
 </main>;
}
