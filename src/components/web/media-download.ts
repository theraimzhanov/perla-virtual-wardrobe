// Browser-safe helpers that save a generated picture as a real file.
//
// A plain <a href={signedStorageUrl} download> does nothing useful: the
// `download` attribute is ignored for cross-origin URLs, so the browser simply
// opens the picture in another tab. Fetching the bytes first and handing the
// click a blob URL is what actually saves the file.

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Turn a free-form title into a safe file stem, keeping it recognisable. */
export function fileStem(title: string) {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return cleaned || "perla-look";
}

/** Pick a file extension from the saved bytes, so the name matches the content. */
export function fileExtension(mimeType: string) {
  const type = (mimeType.split(";")[0] ?? "").trim().toLowerCase();
  return EXTENSIONS[type] ?? "jpg";
}

/** Build the saved file name from a look title and the bytes we are about to save. */
export function mediaFileName(title: string, mimeType: string) {
  return `${fileStem(title)}.${fileExtension(mimeType)}`;
}

/** Save bytes to disk through a same-origin blob URL. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Releasing the URL too early cancels the save, especially on iOS.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Deliver a picture to the visitor. Phones get the share sheet (which offers
 * "Save to Files"); everything else gets a direct download.
 */
export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (error) {
      // The visitor closed the sheet themselves — nothing more to do.
      if ((error as DOMException)?.name === "AbortError") return;
    }
  }
  downloadBlob(blob, filename);
}

/**
 * Read a stored picture into memory. Storage links are cross-origin, so this
 * must run before the click that saves the file.
 */
export async function fetchMediaBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Download unavailable");
  const blob = await response.blob();
  if (!blob.size) throw new Error("Empty download");
  return blob;
}
