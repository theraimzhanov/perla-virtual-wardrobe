import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PerlaMascot } from "@/components/perla/PerlaMascot";
import runway from "@/assets/sunset-runway.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — PERLA" },
      { name: "description", content: "Sign in to PERLA to try on, create and save looks." },
      { property: "og:title", content: "Sign in — PERLA" },
      { property: "og:description", content: "Welcome back to PERLA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://studioperla.live/login" },
    ],
    links: [{ rel: "canonical", href: "https://studioperla.live/login" }],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const switchMode = (m: "signin" | "signup" | "forgot") => { setMode(m); setError(null); setResetSent(false); };
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
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      if (error) setError(error.message); else setResetSent(true);
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); setBusy(false); return; }
      if (password !== confirm) { setError("Passwords do not match."); setBusy(false); return; }
      if (!agreed) { setError("Please agree to the Terms to create an account."); setBusy(false); return; }
    }
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
        ...(fullName ? { data: { full_name: fullName } } : {}),
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
    if (mode === "signup" && !agreed) { setError("Please agree to the Terms to create an account."); return; }
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
    <div className="perla-auth grid min-h-screen bg-background md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center"><PerlaMascot mood="look" className="h-40 w-40" /></div>
          {checkEmail ? (
            <div className="mt-8 rounded-[1.75rem] bg-card p-8 text-center shadow-card">
              <h1 className="font-serif text-3xl">Check your <em className="text-gold">email</em></h1>
              <p className="mt-3 text-sm text-muted-foreground">We sent a confirmation link to {email}. Confirm your address to finish creating your account.</p>
              <Button type="button" onClick={() => { setMode("signin"); setCheckEmail(false); }} className="mt-6 h-auto w-full py-3.5">Back to sign in</Button>
            </div>
          ) : (
            <>
              {mode !== "forgot" && (
                <div role="tablist" className="mt-6 grid grid-cols-2 rounded-full bg-card p-1 shadow-card">
                  {(["signin", "signup"] as const).map((m) => (
                    <Button key={m} variant={mode === m ? "default" : "ghost"} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`h-auto rounded-full py-2.5 text-sm transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                      {m === "signin" ? "Sign in" : "Create account"}
                    </Button>
                  ))}
                </div>
              )}
              <h1 className="mt-6 text-center font-serif text-4xl">
                {mode === "signin" ? <>Welcome <em className="text-gold">back</em></> : mode === "signup" ? <>Create your <em className="text-gold">account</em></> : <>Reset your <em className="text-gold">password</em></>}
              </h1>
              {mode === "forgot" && resetSent ? (
                <div className="mt-8 rounded-[1.75rem] bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
                  If an account exists for {email}, a reset link is on its way. Check your inbox.
                  <Button type="button" onClick={() => switchMode("signin")} className="mt-5 h-auto w-full py-3.5">Back to sign in</Button>
                </div>
              ) : (
              <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" autoComplete="name" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Full name" />
                )}
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Email" />
                {mode !== "forgot" && (
                  <input type="password" required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Password" />
                )}
                {mode === "signup" && (
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Confirm password" />
                )}
                {mode === "signup" && (
                  <label className="flex items-start gap-3 px-4 pt-1 text-left text-xs leading-relaxed text-muted-foreground">
                    <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                    <span>I agree to the PERLA Terms. My data is used only to make the product better and always stays private.</span>
                  </label>
                )}
                {mode === "signin" && (
                  <div className="text-right"><Button variant="link" type="button" onClick={() => switchMode("forgot")} className="h-auto px-4 text-sm text-muted-foreground underline">Forgot password?</Button></div>
                )}
                {error && <p className="px-4 text-center text-sm text-destructive">{error}</p>}
                <Button variant="runway" type="submit" disabled={busy} className="h-auto w-full py-3.5 disabled:opacity-60">{busy ? "One moment…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</Button>
                {mode !== "forgot" && <Button variant="outline" type="button" onClick={handleGoogle} disabled={busy} className="h-auto w-full bg-card py-3.5 disabled:opacity-60">Continue with Google</Button>}
              </form>
              )}
              {mode === "forgot" && !resetSent && (
                <p className="mt-6 text-center text-sm"><Button variant="link" type="button" onClick={() => switchMode("signin")} className="text-muted-foreground underline">Back to sign in</Button></p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="perla-auth-photo hidden md:block"><img src={runway} alt="Coral satin dress on a Mediterranean terrace" width={1920} height={1024} /><div className="absolute inset-x-0 bottom-0 bg-background/85 p-10"><p className="font-serif text-5xl">PERLA</p><p className="mt-2 font-serif text-3xl">Wear it before anyone.</p></div></div>
    </div>
  );
}
