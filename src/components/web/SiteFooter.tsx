import { Link } from "@tanstack/react-router";
import logo from "@/assets/perla-emblem.svg.asset.json";
import { Button } from "@/components/ui/button";
import { privacyPolicyUrl } from "./demo-rules";

const supportEmail = "raimjanovnursultan@gmail.com";
const productLinks = [
  { to: "/app", label: "Discover" },
  { to: "/app/try-on", label: "Try-On" },
  { to: "/app/studio", label: "AI Studio" },
  { to: "/app/insights", label: "Brand Insights" },
] as const;
const accountLinks = [
  { to: "/login", label: "Sign in" },
  { to: "/app/profile", label: "Profile" },
] as const;
const linkClass = "h-auto justify-start whitespace-normal p-0 text-left text-sm font-normal text-muted-foreground hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6 pt-12 md:pt-16">
        <div className="grid gap-x-10 gap-y-10 pb-12 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="min-w-0 sm:col-span-3 lg:col-span-1">
            <Button asChild variant="link" className="h-auto justify-start gap-3 p-0 text-foreground hover:no-underline">
              <Link to="/" aria-label="PERLA home"><img src={logo.url} alt="" className="h-11 w-auto" /><span className="font-serif text-2xl tracking-[0.28em]">PERLA</span></Link>
            </Button>
            <p className="mt-4 max-w-xs font-serif text-2xl">Wear it before anyone.</p>
          </div>
          <nav aria-label="Product">
            <h2 className="text-base font-medium">Product</h2>
            <ul className="mt-5 space-y-3">{productLinks.map((link) => <li key={link.to}><Button asChild variant="link" className={linkClass}><Link to={link.to}>{link.label}</Link></Button></li>)}</ul>
          </nav>
          <nav aria-label="Account">
            <h2 className="text-base font-medium">Account</h2>
            <ul className="mt-5 space-y-3">{accountLinks.map((link) => <li key={link.to}><Button asChild variant="link" className={linkClass}><Link to={link.to}>{link.label}</Link></Button></li>)}</ul>
          </nav>
          <div>
            <h2 className="text-base font-medium">Legal</h2>
            <p className="mt-5 text-sm text-muted-foreground">© 2026 PERLA</p>
            <Button asChild variant="link" className={`${linkClass} mt-3`}><a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Legal enquiries</a></Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-sm text-muted-foreground">
          <span>© 2026 PERLA</span>
          <a href={`mailto:${supportEmail}`} className="min-w-0 break-all transition-colors hover:text-foreground" aria-label={`Contact support at ${supportEmail}`}>{supportEmail}</a>
        </div>
      </div>
    </footer>
  );
}