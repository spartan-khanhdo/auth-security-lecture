import { SessionDetailClient } from "@/components/admin/SessionDetail";

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params;

  return <SessionDetailClient sessionId={id} />;
}
