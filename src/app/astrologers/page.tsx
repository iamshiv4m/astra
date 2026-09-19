import type { Metadata } from "next";
import { DiscoveryScreen } from "@/features/discovery/discovery-screen";
export const metadata: Metadata = { title: "Find your astrologer · ASTRA", description: "Explore personal guidance from ASTRA’s fictional demo astrologers. Filter by expertise, language, price and availability." };
export default function AstrologersPage() { return <DiscoveryScreen />; }
