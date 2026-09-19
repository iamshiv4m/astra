import { Suspense } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
import { LoadingState } from "@/components/ui";
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthScreen role="astrologer" />
    </Suspense>
  );
}
