interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LecturePage({ params }: Props) {
  const { slug } = await params;
  return (
    <main>
      <h1>Lecture: {slug}</h1>
    </main>
  );
}
