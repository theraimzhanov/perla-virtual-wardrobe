import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// No notification source exists yet, so members always see an honest empty state.
export function NotificationsEmpty() {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft"><BellOff className="h-4 w-4 text-gold" /></div>
      <div>
        <p className="font-serif text-lg leading-tight">You have no notifications</p>
        <p className="mt-1 text-xs text-muted-foreground">We'll let you know when there's something new.</p>
      </div>
    </div>
  );
}

export function NotificationsButton({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className={className} aria-label="Notifications" title="Notifications"><Bell className="h-4 w-4" /></Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-2xl p-5"><NotificationsEmpty /></PopoverContent>
    </Popover>
  );
}
