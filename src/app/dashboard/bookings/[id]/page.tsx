import { BookingDetail } from "@/features/client/booking-detail";
export const metadata = { title: "Consultation details | ASTRA" };
export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetail id={id} />;
}
