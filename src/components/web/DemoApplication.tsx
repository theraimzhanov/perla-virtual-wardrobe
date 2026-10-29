import { useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { demoApplicationSchema, privacyPolicyUrl } from "./demo-rules";
import { submitDemoApplication } from "./demo.functions";

export function DemoApplication() {
  const submit = useServerFn(submitDemoApplication);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const lock = useRef(false);
  const request = useRef<string | null>(null);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lock.current || sent) return;
    const form = new FormData(event.currentTarget);
    request.current ??= crypto.randomUUID();
    const parsed = demoApplicationSchema.safeParse({ requestId: request.current, name: form.get("name"), email: form.get("email"), brand: form.get("brand"), message: form.get("message"), website: form.get("website"), consent });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    lock.current = true; setBusy(true); setError(null);
    try { await submit({ data: parsed.data }); setSent(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't send your application. Please retry."); }
    finally { lock.current = false; setBusy(false); }
  };
  if (sent) return <div role="status" className="flex min-h-64 flex-col justify-center border-l-2 border-stat-mint pl-6"><Check className="h-9 w-9 text-stat-mint" /><h3 className="mt-4 font-serif text-3xl">Application received.</h3><p className="mt-2 text-muted-foreground">Your details are saved for the PERLA team to review.</p></div>;
  return <form onSubmit={handleSubmit} aria-label="Demo application" className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm">Your name<Input name="name" autoComplete="name" required minLength={2} maxLength={100} disabled={busy} /></label><label className="space-y-2 text-sm">Work email<Input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></label></div>
    <label className="block space-y-2 text-sm">Brand or company<Input name="brand" autoComplete="organization" required minLength={2} maxLength={120} disabled={busy} /></label>
    <label className="block space-y-2 text-sm">What would you like to explore? <span className="text-muted-foreground">(optional)</span><Textarea name="message" maxLength={2000} rows={3} disabled={busy} /></label>
    <div className="hidden" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
    <div className="flex items-start gap-3"><Checkbox id="demo-consent" checked={consent} disabled={busy} onCheckedChange={(value) => setConsent(value === true)} /><label htmlFor="demo-consent" className="text-xs leading-relaxed text-muted-foreground">I agree that PERLA may use these details to respond to my demo application. <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="underline">Privacy policy</a></label></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy} className="h-auto w-full rounded-full py-3.5">{busy ? <LoaderCircle className="motion-safe:animate-spin" /> : <ArrowRight />}{busy ? "Submitting…" : "Submit application"}</Button>
  </form>;
}