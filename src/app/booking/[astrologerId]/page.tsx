import { BookingScreen } from "@/features/booking/booking-screen";

export const metadata = { title: "Book a consultation | ASTRA" };

export default async function BookingPage({params, searchParams}: {params: Promise<{astrologerId: string}>; searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const [{astrologerId}, search] = await Promise.all([params, searchParams]);
  const query = Object.fromEntries(Object.entries(search).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <BookingScreen astrologerId={astrologerId} query={query} />;
}
