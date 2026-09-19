"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useDemo } from "@/lib/store";
import { WorkspaceShell } from "@/components/workspace-shell";
import { EmptyState, ErrorNotice, LoadingState } from "@/components/ui";

export function ClientWorkspace({children}: {children: ReactNode}) {
  const {state, ready, error, actions} = useDemo();
  const pathname = usePathname();
  return <WorkspaceShell role="client">
    {!ready || state.scenario === "loading" ? <LoadingState /> : !state.clientId ? <EmptyState title="Your space for a little clarity" description="Sign in to your demo profile to see consultations, manage bookings, and make yourself at home." href={`/login?next=${encodeURIComponent(pathname)}`} label="Sign in to continue" /> : state.scenario === "error" ? <div className="stack"><ErrorNotice message="We couldn’t load your workspace in this simulated error scenario. Your saved consultations are unchanged." /><button className="btn btn-primary" onClick={() => actions.setScenario("normal")}>Try again</button><Link href="/astrologers" className="btn btn-ghost">Explore astrologers</Link></div> : <>{error ? <ErrorNotice message={error} /> : null}{children}</>}
  </WorkspaceShell>;
}
