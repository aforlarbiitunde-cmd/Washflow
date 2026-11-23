import { login } from "./actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="nav"><a className="brand" href="/">WashFlow</a><a href="/signup">Create account</a></div>
      <section className="panel">
        <h1>Welcome back</h1>
        <p className="muted">Log in to your business workspace.</p>
        {params.error && <p role="alert" style={{ color: "#ff9b9b" }}>{params.error}</p>}
        {params.message && <p role="status" style={{ color: "#7be0bd" }}>{params.message}</p>}
        <form action={login}>
          <label>Email<input className="field" name="email" type="email" required autoComplete="email" /></label>
          <label>Password<input className="field" name="password" type="password" required autoComplete="current-password" /></label>
          <p><a href="/forgot-password" className="muted">Forgot your password?</a></p>
          <button className="btn" type="submit">Log in</button>
        </form>
      </section>
    </main>
  );
}
