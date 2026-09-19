import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata: Metadata = { title: "Create your account · ASTRA" };
export default function SignupPage() { return <AuthScreen signup />; }
