import { requestPasswordReset } from "./actions";

type SearchParams = Promise<{ error?: string; success?: string }>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="nav"><a className="brand" href="/">WashFlow</a><a href="/login">Back to login</a></div>
      <section className="panel">
        <h1>Reset your password</h1>
        <p className="muted">Enter your account email. We will send a secure reset link when an account matches.</p>
        {params.error && <p role="alert" style={{ color: "#ff9b9b" }}>{params.error}</p>}
        {params.success && <p role="status" style={{ color: "#7be0bd" }}>{params.success}</p>}
        <form action={requestPasswordReset}>
          <label>Email<input className="field" name="email" type="email" required maxLength={254} autoComplete="email" /></label>
          <button className="btn" type="submit">Send reset link</button>
        </form>
      </section>
    </main>
  );
}
