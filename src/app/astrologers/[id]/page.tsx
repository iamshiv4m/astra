import { AstrologerProfile } from "@/features/discovery/profile-screen";
export default async function AstrologerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AstrologerProfile id={id} />;
}
