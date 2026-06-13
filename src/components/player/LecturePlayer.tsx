"use client"; // owns stepIndex + URL sync

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Lecture } from "@/content/types";
import { getNextLectureSlug } from "@/content/queries";
import { useCourseProgress } from "@/components/shell/CourseProgressProvider";
import UnitRenderer from "@/components/units/UnitRenderer";
import PlayerTopBar from "@/components/player/PlayerTopBar";
import PlayerControls from "@/components/player/PlayerControls";
import LectureSidebar from "@/components/player/LectureSidebar";
import UnitCover from "@/components/player/UnitCover";
import UnitStage from "@/components/player/UnitStage";
import SlideTitle from "@/components/player/SlideTitle";

interface ILecturePlayerProps {
  lecture: Lecture;
}

export default function LecturePlayer({ lecture }: ILecturePlayerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { recordStep } = useCourseProgress();

  const totalSteps = lecture.units.length + 1; // cover + units
  const isStub = lecture.units.length === 0;
  const nextLectureSlug = getNextLectureSlug(lecture.slug);
  const hasNextLecture = nextLectureSlug !== undefined;

  // ── Step state ───────────────────────────────────────────────────────────
  const initStep = (() => {
    const raw = searchParams.get("step");
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, totalSteps - 1));
  })();

  const [stepIndex, setStepIndex] = useState<number>(initStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [sideOpen, setSideOpen] = useState<boolean>(false); // false for SSR safety

  // ── Presentation mode ────────────────────────────────────────────────────
  const [isPresentation, setIsPresentation] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);


  // Write corrected step back if clamped on mount
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      const raw = searchParams.get("step");
      const parsed = Number(raw);
      const clamped = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, totalSteps - 1));
      if (parsed !== clamped || raw === null) {
        router.replace(`${pathname}?step=${clamped}`, { scroll: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL + record progress + scroll reset + focus stage on every step change
  useEffect(() => {
    if (!didMountRef.current) return;
    router.replace(`${pathname}?step=${stepIndex}`, { scroll: false });
    recordStep(lecture.slug, stepIndex, totalSteps);
    if (stageRef.current) {
      stageRef.current.scrollTop = 0;
      stageRef.current.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const isLast = stepIndex === totalSteps - 1;

  const goNext = () => {
    if (isStub) return;

    if (isLast) {
      // Finish: record completion then navigate
      recordStep(lecture.slug, totalSteps - 1, totalSteps);
      if (hasNextLecture && nextLectureSlug) {
        router.push(`/lecture/${nextLectureSlug}?step=0`);
      } else {
        router.push("/course");
      }
      return;
    }

    setDirection(1);
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const goPrev = () => {
    if (isStub) return;
    setDirection(-1);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const jumpTo = (i: number) => {
    if (isStub) return;
    const clamped = Math.max(0, Math.min(i, totalSteps - 1));
    setDirection(clamped > stepIndex ? 1 : -1);
    setStepIndex(clamped);
  };

  // ── Presentation mode logic ──────────────────────────────────────────────
  const enterPresentation = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setIsPresentation(false);
    setShowTop(false);
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      if (document.fullscreenElement) {
        setIsPresentation(true);
        setShowTop(false);
      } else {
        setIsPresentation(false);
        setShowTop(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);


  // ── Keyboard handler ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isStub) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        if (event.key === " ") event.preventDefault();
        goNext();
        // Blur focused element to prevent double-trigger on Space
        (document.activeElement as HTMLElement | null)?.blur();
      } else if (event.key === "ArrowLeft") {
        goPrev();
        (document.activeElement as HTMLElement | null)?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStub, stepIndex, totalSteps, isLast, hasNextLecture, nextLectureSlug]);

  // ── Derived values ───────────────────────────────────────────────────────
  const isCover = stepIndex === 0;
  const currentUnit = isCover ? null : lecture.units[stepIndex - 1];

  // ── Stub-lecture branch ──────────────────────────────────────────────────
  if (isStub) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-dim)", marginBottom: "16px" }}>
          This lecture is coming soon.
        </p>
        <a
          href="/course"
          className="btn btn-ghost"
          style={{ textDecoration: "none", display: "inline-flex" }}
        >
          Back to course
        </a>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`course${sideOpen ? " side-open" : ""}`}>
      <LectureSidebar
        lecture={lecture}
        stepIndex={stepIndex}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        onJump={jumpTo}
      />

      {isPresentation && (
        <div
          aria-hidden="true"
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: 8, zIndex: 101 }}
          onMouseEnter={() => setShowTop(true)}
        />
      )}

      <main
        className={`stage${isPresentation ? " presentation" : ""}`}
        ref={stageRef}
        tabIndex={-1}
        aria-label={`Lecture: ${lecture.title}`}
        style={{ outline: "none" }}
      >
        <PlayerTopBar
          lecture={lecture}
          onToggleSidebar={() => setSideOpen((v) => !v)}
          isPresentation={isPresentation}
          showChrome={showTop}
          onEnterPresentation={enterPresentation}
          onExitPresentation={exitPresentation}
          onMouseLeaveChrome={() => setShowTop(false)}
        />

        <UnitStage
          keyId={isCover ? "cover" : (currentUnit?.id ?? "cover")}
          direction={direction}
        >
          {isCover ? (
            <UnitCover lecture={lecture} />
          ) : currentUnit ? (
            <div className="flex flex-col gap-6 w-full h-full">
              {currentUnit.title && currentUnit.type !== 'section' && (
                <SlideTitle
                  title={currentUnit.title}
                  icon={currentUnit.icon}
                  iconColor={currentUnit.iconColor}
                />
              )}
              <UnitRenderer unit={currentUnit} />
            </div>
          ) : null}
        </UnitStage>

        <PlayerControls
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          hasNextLecture={hasNextLecture}
          onPrev={goPrev}
          onNext={goNext}
        />
      </main>
    </div>
  );
}
