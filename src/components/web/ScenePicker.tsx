import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import model from "@/assets/model-after.jpg";
import street from "@/assets/scene-street.jpg";
import runway from "@/assets/scene-runway.jpg";
import goldenHour from "@/assets/example-hat-dress.jpg";
import editorial from "@/assets/community-silk.jpg";
import studio from "@/assets/example-classic-dress.jpg";
import riviera from "@/assets/sunset-runway.jpg";
import night from "@/assets/community-slip.jpg";
import { studioSceneNames, type StudioScene } from "./studio-rules";

const images: Record<StudioScene, string> = {
  Model: model, Street: street, Runway: runway, "Golden Hour": goldenHour,
  Editorial: editorial, "Studio White": studio, Riviera: riviera, "Night Out": night,
};

export function ScenePicker({ value, onChange }: { value: StudioScene; onChange: (scene: StudioScene) => void }) {
  return (
    <div role="group" aria-label="Studio scenes" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {studioSceneNames.map((scene) => (
        <Button key={scene} variant="ghost" aria-pressed={value === scene} onClick={() => onChange(scene)} className={cn("group relative block h-auto min-w-0 overflow-hidden rounded-lg border p-0 text-left", value === scene ? "border-primary ring-2 ring-primary/25" : "border-border")}>
          <img src={images[scene]} alt="" width={768} height={1024} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
          {value === scene && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>}
          <span className={cn("block w-full truncate px-2 py-2.5 text-center text-xs", value === scene ? "bg-primary text-primary-foreground" : "bg-card text-foreground")}>{scene}</span>
        </Button>
      ))}
    </div>
  );
}