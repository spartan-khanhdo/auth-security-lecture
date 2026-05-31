import { notFound } from "next/navigation";
import { getLecture } from "@/content/queries";
import LecturePlayer from "@/components/player/LecturePlayer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LecturePage({ params }: Props) {
  const { slug } = await params;
  const lecture = getLecture(slug);

  if (!lecture) {
    notFound();
  }

  return <LecturePlayer lecture={lecture} />;
}
