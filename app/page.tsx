import LandingHero from "@/components/landing/LandingHero";
import AuthorCard from "@/components/landing/AuthorCard";
import LectureSyllabus from "@/components/home/LectureSyllabus";
import CourseFooter from "@/components/home/CourseFooter";

export default function HomePage() {
  return (
    <main style={{ paddingTop: "60px" }}>
      <div className="wrap">
        <LandingHero />
        <AuthorCard />
        <LectureSyllabus />
        <CourseFooter />
      </div>
    </main>
  );
}
