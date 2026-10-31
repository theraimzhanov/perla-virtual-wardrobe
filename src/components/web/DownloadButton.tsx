import { Download, LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaDownload } from "./useMediaDownload";

/**
 * Saves a generated picture to the visitor's device. The storage link behind a
 * look opens in a new tab when linked directly, so the bytes are read first and
 * handed over as a real file.
 */
export function DownloadButton({
  url,
  title,
  label = "Download",
  className,
  ...props
}: { url: string | undefined; title: string; label?: string } & Omit<ButtonProps, "onClick">) {
  const { download, saving } = useMediaDownload(title, url);
  return (
    <Button
      {...props}
      size={props.size ?? "icon"}
      variant={props.variant ?? "outline"}
      disabled={props.disabled || !url || saving}
      aria-label={label}
      title={label}
      onClick={download}
      className={cn("rounded-full", className)}
    >
      {saving ? <LoaderCircle className="motion-safe:animate-spin" /> : <Download />}
    </Button>
  );
}
