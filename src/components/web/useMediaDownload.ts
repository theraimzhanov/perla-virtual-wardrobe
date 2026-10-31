import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deliverFile, fetchMediaBlob, mediaFileName } from "./media-download";

/**
 * Keep a stored picture ready so the save button can act the moment it is
 * clicked. Storage links are cross-origin, so the bytes are read ahead of time;
 * waiting for them inside the click is what makes phones ignore the save.
 */
export function useMediaDownload(title: string, url: string | undefined) {
  const blob = useRef<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    blob.current = null;
    if (!url) return;
    let alive = true;
    void fetchMediaBlob(url)
      .then((value) => {
        if (alive) blob.current = value;
      })
      .catch(() => {
        // Not ready yet — the click falls back to fetching then saving.
      });
    return () => {
      alive = false;
    };
  }, [url]);

  const download = useCallback(() => {
    const value = blob.current;
    if (value) {
      void deliverFile(value, mediaFileName(title, value.type));
      return;
    }
    if (!url || saving) return;
    setSaving(true);
    void fetchMediaBlob(url)
      .then(async (fetched) => {
        blob.current = fetched;
        await deliverFile(fetched, mediaFileName(title, fetched.type));
      })
      .catch(() => toast.error("Couldn't download the picture. Please try again."))
      .finally(() => setSaving(false));
  }, [saving, title, url]);

  return { download, saving };
}
