import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import GlobalCursorTwinkles from "./GlobalCursorTwinkles";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <GlobalCursorTwinkles />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
