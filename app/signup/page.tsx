import { signup } from "./actions";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <main className="container" style={{ maxWidth: 600 }}>
      <div className="nav"><a className="brand" href="/">WashFlow</a><a href="/login">Log in</a></div>
      <section className="panel">
        <h1>Create your WashFlow workspace</h1>
        <p className="muted">Register your business. Verify your email before signing in.</p>
        {params.error && <p role="alert" style={{ color: "#ff9b9b" }}>{params.error}</p>}
        {params.success && <p role="status" style={{ color: "#7be0bd" }}>{params.success}</p>}
        <form action={signup}>
          <label>Business name<input className="field" name="business_name" required maxLength={120} autoComplete="organization" /></label>
          <label>Your full name<input className="field" name="owner_name" required maxLength={120} autoComplete="name" /></label>
          <label>Email<input className="field" name="email" type="email" required maxLength={254} autoComplete="email" /></label>
          <label>Phone / WhatsApp<input className="field" name="phone" required maxLength={30} autoComplete="tel" /></label>
          <label>Country<input className="field" name="country" required maxLength={80} autoComplete="country-name" /></label>
          <label>Password<input className="field" name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
          <label><input type="checkbox" name="terms" required /> I agree to the <a href="/terms" target="_blank" rel="noreferrer">terms</a> and <a href="/privacy" target="_blank" rel="noreferrer">privacy policy</a>.</label>
          <p><button className="btn" type="submit">Create account</button></p>
        </form>
      </section>
    </main>
  );
}
