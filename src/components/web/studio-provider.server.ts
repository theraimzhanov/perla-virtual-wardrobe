import { GenerationProviderError } from "./generation-provider.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/images/edits";
const MODEL = "openai/gpt-image-2.5-sunburst";

type Frame = { type?: string; b64_json?: string; error?: { message?: string } };

// Restyle a saved try-on photo. Streams so long renders keep the connection alive; reads until the body ends.
export async function renderStudioImage(image: { bytes: Uint8Array; mime: string }, prompt: string) {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new GenerationProviderError("AI Studio setup is not complete yet.");
  const form = new FormData();
  form.set("model", MODEL);
  form.set("prompt", prompt);
  form.set("size", "1024x1536");
  form.set("quality", "medium");
  form.set("stream", "true");
  form.append("image", new File([image.bytes as Uint8Array<ArrayBuffer>], `look.${image.mime === "image/png" ? "png" : "jpg"}`, { type: image.mime }));
  const response = await fetch(GATEWAY, { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form });
  if (!response.ok || !response.body) {
    const status = response.status;
    console.error("Studio render rejected", status);
    throw new GenerationProviderError(status === 402 ? "AI credits have run out. Add credits in Settings → Plans & credits." : status === 429 ? "AI Studio is busy. Please try again in a minute." : status === 400 ? "This scene or prompt couldn't be used. Try different words." : "AI Studio couldn't create this image. Please try again.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: string | null = null;
  let failure: string | null = null;
  const handle = (block: string) => {
    const data = block.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("");
    const event = block.split("\n").find((line) => line.startsWith("event:"))?.slice(6).trim();
    if (!data || data === "[DONE]") return;
    try {
      const frame = JSON.parse(data) as Frame;
      if (event === "error" || frame.type === "error") failure = frame.error?.message ?? "AI Studio couldn't create this image.";
      else if (frame.type?.endsWith(".completed") && frame.b64_json) final = frame.b64_json;
    } catch { /* ignore heartbeat or partial noise */ }
  };
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true }).replace(/\r\n/g, "\n");
    let index: number;
    while ((index = buffer.indexOf("\n\n")) >= 0) { handle(buffer.slice(0, index)); buffer = buffer.slice(index + 2); }
  }
  if (buffer.trim()) handle(buffer);
  if (failure) { console.error("Studio render failed in stream"); throw new GenerationProviderError("AI Studio couldn't create this image. Try a different scene or prompt."); }
  if (!final) throw new GenerationProviderError("AI Studio returned no image. Please try again.");
  const binary = atob(final);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
