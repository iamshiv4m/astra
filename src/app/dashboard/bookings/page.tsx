import { ClientBookings } from "@/features/client/bookings";
export const metadata = {title: "Your consultations | ASTRA"};
export default async function BookingsPage({searchParams}: {searchParams: Promise<{tab?: string}>}) {
  const {tab} = await searchParams;
  return <ClientBookings initialTab={tab === "past" ? "past" : "upcoming"} />;
}
