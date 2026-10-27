import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/perla-emblem.svg.asset.json";
import after from "@/assets/model-after.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — PERLA" },
      { name: "description", content: "Sign in to PERLA to try on, create and save looks." },
      { property: "og:title", content: "Sign in — PERLA" },
      { property: "og:description", content: "Welcome back to PERLA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/app" });
    });
  }, [nav]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      nav({ to: "/app" });
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      setBusy(false);
      return;
    }
    nav({ to: "/app" });
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <img src={logo.url} alt="PERLA" className="mx-auto h-40 w-auto" />
          {checkEmail ? (
            <div className="mt-8 rounded-[1.75rem] bg-card p-8 text-center shadow-card">
              <h1 className="font-serif text-3xl">Check your <em className="text-gold">email</em></h1>
              <p className="mt-3 text-sm text-muted-foreground">We sent a confirmation link to {email}. Confirm your address to finish creating your account.</p>
              <button type="button" onClick={() => { setMode("signin"); setCheckEmail(false); }} className="mt-6 w-full rounded-full bg-primary py-3.5 text-primary-foreground shadow-soft">Back to sign in</button>
            </div>
          ) : (
            <>
              <h1 className="mt-4 text-center font-serif text-4xl">
                {mode === "signin" ? <>Welcome <em className="text-gold">back</em></> : <>Create your <em className="text-gold">account</em></>}
              </h1>
              <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" autoComplete="name" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Full name" />
                )}
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Email" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Password" />
                {error && <p className="px-4 text-center text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={busy} className="w-full rounded-full bg-primary py-3.5 text-primary-foreground shadow-soft disabled:opacity-60">{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}</button>
                <button type="button" onClick={handleGoogle} disabled={busy} className="w-full rounded-full bg-card py-3.5 shadow-card disabled:opacity-60">Continue with Google</button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? <>New here? <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-foreground underline">Create an account</button></> : <>Already a member? <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-foreground underline">Sign in</button></>}
              </p>
            </>
          )}
        </div>
      </div>
      <img src={after} alt="" className="hidden h-full w-full object-cover md:block" />
    </div>
  );
}
