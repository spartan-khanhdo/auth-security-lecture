import LandingHero from "@/components/landing/LandingHero";
import AuthorCard from "@/components/landing/AuthorCard";

export default function HomePage() {
  return (
    <main style={{ paddingTop: "60px" }}>
      <div className="wrap">
        <LandingHero />
        <AuthorCard />
      </div>
    </main>
  );
}
