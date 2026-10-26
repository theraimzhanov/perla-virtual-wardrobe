import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Bell, Compass, LayoutDashboard, Sparkles, User, Wand2, Search, Smartphone } from "lucide-react";
import logo from "@/assets/perla-logo-clean.png.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({ component: AppLayout });

const nav = [
  { to: "/app", label: "Discover", icon: Compass, exact: true },
  { to: "/app/try-on", label: "Try-On", icon: Wand2 },
  { to: "/app/studio", label: "AI Studio", icon: Sparkles },
  { to: "/app/insights", label: "Brand Insights", icon: LayoutDashboard },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-center" />
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r px-5 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-2">
          <img src={logo.url} alt="PERLA" className="h-12 w-12 rounded-full object-cover object-[50%_25%] scale-125 shadow-card" />
        </Link>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "!bg-primary !text-primary-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t px-2 pt-5"><p className="font-serif text-lg">Made for your next look.</p><p className="mt-1 text-[10px] uppercase text-gold">PERLA · Hackathon edition</p></div>
        <Link to="/mobile" className="mt-4 flex items-center gap-2 px-2 text-xs text-muted-foreground hover:text-foreground">
          <Smartphone className="h-3.5 w-3.5" /> Open mobile version
        </Link>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/85 px-6 py-4 backdrop-blur md:px-10">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-card">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search pieces, brands, styles…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Button size="icon" variant="ghost" className="hidden h-10 w-10 shrink-0 rounded-full bg-card shadow-card sm:inline-flex" aria-label="Notifications" title="Notifications"><Bell className="h-4 w-4" /></Button>
          <Link to="/app/profile" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-gradient text-sm font-semibold text-primary-foreground">NR</Link>
        </header>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto border-b px-6 py-3 lg:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="whitespace-nowrap rounded-full bg-card px-4 py-1.5 text-sm shadow-card" activeProps={{ className: "!bg-primary !text-primary-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="px-6 py-10 md:px-10"><Outlet /></main>
      </div>
    </div>
  );
}
