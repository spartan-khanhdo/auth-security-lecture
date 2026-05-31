import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthorCard from "@/components/landing/AuthorCard";

const TOPICS = [
  "OAuth 2.0",
  "JWT",
  "mTLS",
  "OWASP",
  "RBAC / ABAC",
];

export default function LandingHero() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
        Authentication &amp; Security
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        An interactive course on authentication flows, JWT best practices,
        service-to-service auth, and security fundamentals.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {TOPICS.map((topic) => (
          <Badge key={topic} variant="secondary">
            {topic}
          </Badge>
        ))}
      </div>

      <div className="mb-12 flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/course">Start Learning</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/quiz">Jump to Quiz</Link>
        </Button>
      </div>

      <AuthorCard />
    </div>
  );
}
