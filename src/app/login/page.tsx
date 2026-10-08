"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("student@demo.unicross.edu.ng");
  const [password, setPassword] = useState("Demo@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Sign-in failed.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <a className="backLink" href="/">← Back to campus</a>
        <div className="authBrand">
          <span className="brandMark">U</span>
          <div>
            <b>UNICROSS Digital Campus</b>
            <small>Secure portal access</small>
          </div>
        </div>

        <h1>Sign in</h1>
        <p className="authIntro">
          Access your university workspace using your institutional account.
        </p>

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="formError">{error}</div>}

          <button className="primary authButton" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="demoBox">
          <b>Prototype demo account</b>
          <span>Student: student@demo.unicross.edu.ng</span>
          <span>Password: Demo@12345</span>
        </div>

        <p className="authNote">
          Prototype only. Demo credentials and synthetic data are not official university accounts.
        </p>
      </div>
    </main>
  );
}
