"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Compass, House, LayoutDashboard, Menu, Sparkles, UserRound, Users, Video } from "lucide-react";
import { useDemo } from "@/lib/store";
import type { Role } from "@/types/domain";
import { Brand } from "./brand";
import { Badge, Modal } from "./ui";

export function WorkspaceShell({ role, children }: { role: Role; children: ReactNode }) {
  const path = usePathname();
  const params = useSearchParams();
  const { state } = useDemo();
  const [menu, setMenu] = useState(false);
  const client = state.clients.find(c => c.id === state.clientId);
  const astro = state.astrologers.find(a => a.id === state.astrologerId);
  const items = role === "astrologer"
    ? [{ href: "/astrologer/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/astrologer/sessions", label: "Sessions", icon: Video }, { href: "/astrologer/availability", label: "Availability", icon: CalendarDays }, { href: "/astrologer/sessions?view=clients", label: "Clients", icon: Users }, { href: "/astrologer/profile", label: "Profile", icon: UserRound }]
    : [{ href: "/dashboard", label: "Overview", icon: House }, { href: "/dashboard/bookings", label: "My sessions", icon: Video }, { href: "/astrologers", label: "Explore", icon: Compass }, { href: "/dashboard/profile", label: "My profile", icon: UserRound }];
  const active = (href: string) => href.includes("?") ? path === href.split("?")[0] && params.get("view") === "clients" : (path === href || (href === "/dashboard/bookings" && path.startsWith(`${href}/`))) && !(href === "/astrologer/sessions" && params.get("view") === "clients");
  const links = items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined} onClick={() => setMenu(false)}><Icon size={18} /><span>{label}</span></Link>);
  return <div className="workspace"><aside className="workspace-sidebar"><Brand /><p className="workspace-role">{role === "client" ? "Your personal space" : "Astrologer workspace"}</p><nav className="workspace-nav" aria-label={`${role} navigation`}>{links}</nav><div className="workspace-sidebar-bottom"><Sparkles size={20} color="#c4a16a" /><p>A little perspective can make<br />a world of difference.</p><Link className="text-link" href="/" style={{ marginTop: 12 }}>Back to ASTRA</Link></div></aside><div className="workspace-body"><div className="workspace-mobile-bar"><Brand /><button className="icon-button" aria-label="Open workspace navigation" onClick={() => setMenu(true)}><Menu size={22} /></button></div><header className="workspace-topbar"><p className="topbar-note">Clarity, one conversation away.</p><div className="topbar-account"><Badge tone="gold">Demo workspace</Badge><span>{role === "client" ? client?.name || "Welcome" : astro?.name || "Welcome"}</span><span className="initial-avatar">{(role === "client" ? client?.name : astro?.name)?.charAt(0) || "A"}</span></div></header><div className="workspace-content">{children}</div></div><nav className="mobile-bottom-nav" aria-label="Quick navigation">{links}</nav><Modal open={menu} onOpenChange={setMenu} title={role === "client" ? "Your space" : "Astrologer workspace"}><nav className="mobile-menu">{links}<Link href="/" onClick={() => setMenu(false)}>Back to ASTRA</Link><Link href="/tech-stack" onClick={() => setMenu(false)}>Inside ASTRA</Link></nav></Modal></div>;
}
