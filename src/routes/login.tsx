import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/perla-emblem.svg.asset.json";
import after from "@/assets/model-after.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — PERLA" },
      { name: "description", content: "Sign in to PERLA to try on, create and save looks." },
      { property: "og:title", content: "Sign in — PERLA" },
      { property: "og:description", content: "Welcome back to PERLA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <form className="w-full max-w-sm" onSubmit={(e) => { e.preventDefault(); nav({ to: "/app" }); }}>
          <img src={logo.url} alt="PERLA" className="mx-auto h-40 w-auto" />
          <h1 className="mt-4 text-center font-serif text-4xl">Welcome <em className="text-gold">back</em></h1>
          <div className="mt-8 space-y-3">
            <input type="email" defaultValue="nursultan@perla.app" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Email" />
            <input type="password" defaultValue="password" className="w-full rounded-full bg-card px-5 py-3.5 shadow-card outline-none" aria-label="Password" />
            <button className="w-full rounded-full bg-primary py-3.5 text-primary-foreground shadow-soft">Sign in</button>
            <button type="button" onClick={() => nav({ to: "/app" })} className="w-full rounded-full bg-card py-3.5 shadow-card">Continue with Google</button>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link to="/app" className="text-foreground underline">Create an account</Link></p>
        </form>
      </div>
      <img src={after} alt="" className="hidden h-full w-full object-cover md:block" />
    </div>
  );
}
