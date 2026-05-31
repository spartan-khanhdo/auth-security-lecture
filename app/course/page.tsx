import LectureSyllabus from "@/components/home/LectureSyllabus";

export const metadata = {
  title: "Course — Authentication & Security",
};

export default function CoursePage() {
  return (
    <div className="wrap" style={{ paddingBottom: 64 }}>
      <LectureSyllabus />
    </div>
  );
}
