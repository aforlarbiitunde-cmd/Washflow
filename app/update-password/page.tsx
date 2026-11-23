import { updatePassword } from "./actions";

type SearchParams = Promise<{ error?: string }>;

export default async function UpdatePasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="nav"><a className="brand" href="/">WashFlow</a><a href="/login">Log in</a></div>
      <section className="panel">
        <h1>Choose a new password</h1>
        <p className="muted">Use at least 12 characters.</p>
        {params.error && <p role="alert" style={{ color: "#ff9b9b" }}>{params.error}</p>}
        <form action={updatePassword}>
          <label>New password<input className="field" name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
          <label>Confirm password<input className="field" name="confirm_password" type="password" required minLength={12} autoComplete="new-password" /></label>
          <button className="btn" type="submit">Update password</button>
        </form>
      </section>
    </main>
  );
}
