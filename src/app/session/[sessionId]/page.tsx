import type { Metadata } from "next";
import SessionPage from "@/features/session/session-page";

export const metadata: Metadata = { title: "Your consultation · ASTRA", description: "Your private, simulated ASTRA consultation room." };

export default async function ConsultationPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const [{ sessionId }, { demo }] = await Promise.all([params, searchParams]);
  return <SessionPage sessionId={sessionId} demoRequested={demo === "1"} />;
}
