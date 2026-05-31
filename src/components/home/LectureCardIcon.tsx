import type { Lecture } from "@/content/types";

interface ILectureCardIconProps {
  iconKey: Lecture["iconKey"];
  className?: string;
}

export default function LectureCardIcon({ iconKey, className }: ILectureCardIconProps) {
  const sharedProps = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };

  switch (iconKey) {
    case "swap":
      return (
        <svg {...sharedProps}>
          <path d="M7 7h10M7 7l3-3M7 7l3 3M17 17H7M17 17l-3-3M17 17l-3 3" />
        </svg>
      );
    case "key":
      return (
        <svg {...sharedProps}>
          <circle cx="8" cy="14" r="4" />
          <path d="M11 14h11M19 14v4M22 14v3" />
        </svg>
      );
    case "server":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="8" rx="2" />
          <rect x="3" y="13" width="18" height="8" rx="2" />
          <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "shield":
      return (
        <svg {...sharedProps}>
          <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" />
        </svg>
      );
    case "puzzle":
      return (
        <svg {...sharedProps}>
          <path d="M10 3h4v3a2 2 0 1 0 0 4v4h-4a2 2 0 1 1-4 0H3v-4a2 2 0 1 0 0-4V3z" />
        </svg>
      );
    default:
      return null;
  }
}
