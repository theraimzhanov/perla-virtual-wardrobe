import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { photoQuestions, videoQuestions } from "./try-on-rules";
import { cn } from "@/lib/utils";

export function ResultFeedback({ kind }: { kind: "photo" | "video" }) {
  const questions = kind === "photo" ? photoQuestions : videoQuestions;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  return (
    <section aria-label={`${kind === "photo" ? "Photo" : "Video"} feedback`} className="mt-6 border-t pt-5">
      <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-serif text-2xl">Your first impression</h3><span className="text-xs text-muted-foreground">{Object.keys(answers).length}/3</span></div>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <fieldset key={question.id} disabled={submitted}>
            <legend className="mb-2 text-sm">{index + 1}. {question.text}</legend>
            <div className="flex flex-wrap gap-2">{question.options.map((option) => <Button key={option} size="sm" variant="outline" aria-pressed={answers[question.id] === option} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))} className={cn("rounded-full", answers[question.id] === option && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>{option}</Button>)}</div>
          </fieldset>
        ))}
      </div>
      <Button variant="ghost" className="mt-4 px-0 text-gold hover:bg-transparent" disabled={Object.keys(answers).length !== 3 || submitted} onClick={() => setSubmitted(true)}>{submitted ? <Check /> : <Send />}{submitted ? "Feedback recorded for this demo" : "Send feedback"}</Button>
    </section>
  );
}