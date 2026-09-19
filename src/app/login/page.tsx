import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata: Metadata = { title: "Sign in · ASTRA" };
export default function LoginPage() { return <AuthScreen />; }
