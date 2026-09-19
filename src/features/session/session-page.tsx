"use client";

import { LoadingState } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { ConsultationRoom } from "./consultation-room";

export default function SessionPage({
  sessionId,
  demoRequested = false,
}: {
  sessionId: string;
  demoRequested?: boolean;
}) {
  const { state, ready, error, actions } = useDemo();
  if (!ready || !state || state.scenario === "loading") return <LoadingState />;
  return (
    <ConsultationRoom
      sessionId={sessionId}
      demoRequested={demoRequested}
      state={state}
      error={error}
      actions={actions}
    />
  );
}
