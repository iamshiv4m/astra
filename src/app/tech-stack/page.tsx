import type { Metadata } from "next";
import { Architecture } from "@/features/architecture/architecture";
export const metadata: Metadata = { title: "Inside ASTRA" };
export default function TechStackPage() { return <Architecture />; }
