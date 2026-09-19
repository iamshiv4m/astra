import { Suspense } from "react";
import { AstrologerSessions, AstrologerWorkspace } from "@/features/astrologer/workspace";
import { LoadingState } from "@/components/ui";
export default function Page() {
  return (
    <AstrologerWorkspace>
      <Suspense fallback={<LoadingState />}>
        <AstrologerSessions />
      </Suspense>
    </AstrologerWorkspace>
  );
}
