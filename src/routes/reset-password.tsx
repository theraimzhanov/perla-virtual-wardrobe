import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/perla-emblem.svg.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — PERLA" },
      { name: "description", content: "Choose a new password for your PERLA account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reset password — PERLA" },
      { property: "og:description", content: "Choose a new password for your PERLA account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    nav({ to: "/app" });
  }

  const input = "w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <img src={logo.url} alt="PERLA" className="mx-auto h-32 w-auto" />
        <h1 className="mt-4 text-center font-serif text-4xl">New <em className="text-gold">password</em></h1>
        {ready ? (
          <form className="mt-8 space-y-3" onSubmit={submit}>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" className={input} aria-label="New password" />
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" className={input} aria-label="Confirm new password" />
            {error && <p className="px-4 text-center text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-primary py-3.5 text-primary-foreground shadow-soft disabled:opacity-60">{busy ? "One moment…" : "Save new password"}</button>
          </form>
        ) : (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Open this page from the reset link in your email. <Link to="/login" className="text-foreground underline">Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
