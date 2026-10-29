import { useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sampleModels } from "./sample-models";

export function SamplePhotoPicker({ disabled, onSelect }: { disabled: boolean; onSelect: (image: string, id: string) => Promise<boolean> }) {
  const [pending, setPending] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const lock = useRef(false);
  const choose = async (image: string, id: string) => {
    if (lock.current || disabled) return;
    lock.current = true;
    setPending(id);
    try { if (await onSelect(image, id)) setPicked(id); }
    finally { lock.current = false; setPending(null); }
  };
  return <div className="mt-5 space-y-3"><p className="text-xs text-muted-foreground">Or choose a sample model</p>{["Women", "Men"].map((group) => <div key={group}><p className="mb-2 text-[10px] uppercase text-muted-foreground">{group}</p><div className="grid grid-cols-3 gap-2">{sampleModels.filter((model) => model.group === group).map((model) => <Button key={model.id} variant="outline" disabled={disabled || pending !== null} aria-label={`Use sample ${model.label.toLowerCase()}`} aria-pressed={picked === model.id} className="relative h-auto overflow-hidden rounded-lg p-0" onClick={() => { void choose(model.image, model.id); }}><img src={model.image} alt={model.label} width={768} height={1024} loading="lazy" className="aspect-[3/4] w-full object-contain" />{pending === model.id ? <LoaderCircle className="absolute bottom-2 right-2 text-primary motion-safe:animate-spin" /> : picked === model.id ? <Check className="absolute bottom-2 right-2 text-primary" /> : null}</Button>)}</div></div>)}</div>;
}