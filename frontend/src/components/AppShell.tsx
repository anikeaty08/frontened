import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import HeroTwinkle from "./HeroTwinkle";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <HeroTwinkle variant="trail" />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
