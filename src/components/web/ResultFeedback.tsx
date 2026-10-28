import { useRef, useState } from "react";
import { Check, LoaderCircle, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { questionsFor, type ProductMode } from "./try-on-rules";
import { saveFeedback } from "./looks.functions";
import { cn } from "@/lib/utils";

// Saved looks send their three answers to the database; sample previews keep them on screen only.
export function ResultFeedback({ kind, mode = "discover", jobId, alreadySent = false, onAnswer, onSent }: { kind: "photo" | "video"; mode?: ProductMode; jobId?: string; alreadySent?: boolean; onAnswer?: (question: string, answer: string) => void; onSent?: () => void }) {
  const questions = questionsFor(kind, mode);
  const send = useServerFn(saveFeedback);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(alreadySent);
  const [sending, setSending] = useState(false);
  const lock = useRef(false);
  const submit = async () => {
    if (lock.current || submitted || Object.keys(answers).length !== 3) return;
    lock.current = true; setSending(true);
    try {
      if (jobId) await send({ data: { jobId, answers } });
      setSubmitted(true); onSent?.();
      toast.success("Thanks — feedback sent");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Couldn't send your feedback. Please retry."); }
    finally { lock.current = false; setSending(false); }
  };
  return (
    <section aria-label={`${kind === "photo" ? "Photo" : "Video"} feedback`} className="mt-6 border-t pt-5">
      <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-serif text-2xl">Your first impression</h3><span className="text-xs text-muted-foreground">{submitted ? "3" : Object.keys(answers).length}/3</span></div>
      {submitted && alreadySent ? <p className="text-sm text-muted-foreground">You already shared feedback on this look.</p> : <div className="space-y-4">
        {questions.map((question, index) => (
          <fieldset key={question.id} disabled={submitted || sending}>
            <legend className="mb-2 text-sm">{index + 1}. {question.text}</legend>
            <div className="flex flex-wrap gap-2">{question.options.map((option) => <Button key={option} size="sm" variant="outline" aria-pressed={answers[question.id] === option} onClick={() => { setAnswers((current) => ({ ...current, [question.id]: option })); onAnswer?.(question.id, option); }} className={cn("rounded-full", answers[question.id] === option && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>{option}</Button>)}</div>
          </fieldset>
        ))}
      </div>}
      <Button size="lg" className="mt-5 h-12 w-full rounded-full text-base [&_svg]:size-5" disabled={Object.keys(answers).length !== 3 || submitted || sending} onClick={() => { void submit(); }}>{sending ? <LoaderCircle className="motion-safe:animate-spin" /> : submitted ? <Check /> : <Send />}{sending ? "Sending…" : submitted ? "Feedback sent" : "Send feedback"}</Button>
    </section>
  );
}
