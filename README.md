# PERLA — AI Fashion Discovery & Demand-Intelligence Platform

<p align="center">
  <img src="https://studioperla.live/favicon.svg" alt="PERLA logo" width="96" />
</p>

<p align="center">
  <strong>Wear it before anyone.</strong><br />
  A two-sided platform connecting shopper virtual try-on with real-time brand demand insights.
</p>

<p align="center">
  <a href="https://studioperla.live"><strong>Live app: studioperla.live</strong></a>
</p>

---

## Hackathon Submission

- **Category:** Fashion virtual try-on and eCommerce
- **Live demo:** https://studioperla.live   Demo account: demo@perla.com  Password: 123456
- **Author:** Nursultan Raimzhanov

---

## Problem & Solution

### The problem
- **Shoppers** can't see how clothes and accessories look on them before buying, so online fashion has high return rates.
- **Brands** decide what to produce from guesswork, which leads to deadstock and waste.

### How PERLA solves it
1. **Shoppers** pick a catalog piece or upload their own and see it on their photo with Perfect Corp YouCam virtual try-on.
2. **Every try-on becomes a demand signal.** A short 5-question survey after each try-on captures fit, occasion, color, perceived quality and purchase intent.
3. **Brands** see this in **Brand Insights**: most-tried and most-liked products, feedback trends, fit and sizing risk, and AI summaries — before committing to production.

---

## Key Features

- **Multi-category virtual try-on** — clothes, bags, hats and shoes.
- **Smart routing for personal uploads** — Gemini classifies an uploaded item's category, then PERLA calls the matching YouCam endpoint.
- **Sample models** — male and female sample photos so anyone can try it instantly.
- **AI Studio** — restyle a try-on look into editorial scenes or a custom prompt with YouCam image-to-image.
- **Feedback survey** — five quick questions after each try-on, saved to the database.
- **Community looks** — shared generated photos; tap the star on any look to try the same product yourself.
- **Brand Insights dashboard** — real member, try-on, like and product counts; product rankings; feedback trends; fit risk.
- **Automated reports** — n8n sends aggregated, anonymized product and survey reports to Google Sheets every two weeks, with Gemini-written summaries.
- **Accounts** — email/password and Google sign-in, password reset, saved looks and wardrobe in Profile.

---

## Architecture

```text
Shopper (web / mobile browser)
   │
   ▼
TanStack Start app (React 19, Tailwind CSS v4, shadcn/ui, server functions)
   │
   ├── Supabase: Auth, PostgreSQL with Row Level Security, Storage
   │     ├── private bucket: user photos and personal product uploads
   │     └── generated-looks bucket: saved try-on results
   │
   ├── Perfect Corp YouCam AI APIs (visual engine)
   │     ├── cloth-v4         clothes try-on
   │     ├── bag              bag try-on
   │     ├── hat              hat try-on
   │     ├── shoes-transfer   shoes try-on
   │     └── image-to-image   AI Studio restyling (youcam-image-v2)
   │
   ├── Google Gemini API: product classification, insight and Style DNA text
   │
   └── n8n: scheduled Brand Insights and Google Sheets reports
```

### YouCam APIs used
| Endpoint | Used for |
|---|---|
| `cloth-v4` | Clothing virtual try-on |
| `bag` | Bag virtual try-on |
| `hat` | Hat virtual try-on |
| `shoes-transfer` | Shoes virtual try-on |
| `image-to-image/youcam` (`youcam-image-v2`) | AI Studio scene and prompt restyling |

---

## Privacy

- User photos and personal uploads are private, owner-scoped, and shown only through short-lived signed links.
- Community looks share only the generated image and the product — never the original model photo.
- Brand Insights and Google Sheets reports contain only aggregated data, with no customer names, emails or private images.
- Privacy notice: [PRIVACY.md](./PRIVACY.md)

---

## Testing Instructions for Judges

No installation needed.

1. Open **https://studioperla.live** and sign in using the demo account: demo@perla.com password: 123456 , or create an account with email or Google.
2. **Discover** — choose a clothing item, bag, hat or shoes, or use **Upload from local** for your own item.
3. **Try On** — upload your photo or pick a sample model, then press **Generate**. Results usually arrive in under a minute.
4. **Feedback** — answer the five quick questions under the result.
5. **AI Studio** — pick a scene or type a prompt to restyle your look.
6. **Brand Insights** — see product rankings, community looks, feedback trends and fit risk update with real activity.

---

## Local Development

### Requirements
- [Bun](https://bun.sh) (or Node.js 20+)
- Supabase project
- Perfect Corp YouCam API key
- Google Gemini API key

### Setup
```bash
git clone https://github.com/<your-username>/perla.git
cd perla
bun install
```

Create a `.env` file:
```env
# Browser (public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Server (secret)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PERFECT_CORP_API_KEY=your_youcam_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Apply the database migrations in `supabase/migrations`, then run:
```bash
bun dev        # start at http://localhost:8080
bunx vitest run  # run tests
```

---

## Built With

- Perfect Corp YouCam AI APIs — virtual try-on and image generation
- Google Gemini API — classification and insight text
- TanStack Start, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase — Auth, PostgreSQL, Storage
- n8n and Google Sheets — scheduled reporting
- Built with the help of Lovable

---

## License

Licensed under the [MIT License](./LICENSE).

Copyright (c) 2026 Nursultan Raimzhanov. Created for the YouCam API Skin AI & eCommerce VTO Hackathon.

Third-party services, trademarks and product imagery remain subject to their respective terms and rights.

---

## Screenshots

![PERLA screenshot 1](docs/screenshots/Screenshot%202026-10-31%20021858.png)

![PERLA screenshot 2](docs/screenshots/Screenshot%202026-10-31%20022630.png)

![PERLA screenshot 3](docs/screenshots/Screenshot%202026-10-31%20022714.png)

![PERLA screenshot 4](docs/screenshots/Screenshot%202026-10-31%20022801.png)

![PERLA screenshot 5](docs/screenshots/Screenshot%202026-10-31%20022936.png)

![PERLA screenshot 6](docs/screenshots/Screenshot%202026-10-31%20023044.png)

![PERLA screenshot 7](docs/screenshots/Screenshot%202026-10-31%20023133.png)

![PERLA screenshot 8](docs/screenshots/Screenshot%202026-10-31%20023158.png)

![PERLA screenshot 9](docs/screenshots/Screenshot%202026-10-31%20023404.png)

![PERLA screenshot 10](docs/screenshots/Screenshot%202026-10-31%20023536.png)

