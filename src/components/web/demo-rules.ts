import { z } from "zod";

export const privacyPolicyUrl = "https://github.com/theraimzhanov/perla-virtual-wardrobe/blob/HEAD/PRIVACY.md";
export const demoApplicationSchema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().email("Enter a valid email.").max(254),
  brand: z.string().trim().min(2, "Enter your brand or company.").max(120),
  message: z.string().trim().max(2000).default(""),
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree to be contacted about your application." }) }),
  website: z.string().max(0).default(""),
});