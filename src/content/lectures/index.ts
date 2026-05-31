import type { Lecture } from "@/content/types";
import { oauthAuthn } from "./oauth-authn";
import { jwtBestPractices } from "./jwt-best-practices";
import { serviceToService } from "./service-to-service";
import { securityFundamentals } from "./security-fundamentals";
import { gaps } from "./gaps";

export type LectureSlug = Lecture["slug"];

export const LECTURES: Lecture[] = [
  oauthAuthn,
  jwtBestPractices,
  serviceToService,
  securityFundamentals,
  gaps,
];

export const LECTURES_BY_SLUG: Record<LectureSlug, Lecture> = {
  "oauth-authn": oauthAuthn,
  "jwt-best-practices": jwtBestPractices,
  "service-to-service": serviceToService,
  "security-fundamentals": securityFundamentals,
  gaps: gaps,
};

// Backward-compatible alias — LectureSyllabus.tsx imports `lectures` (lowercase).
// Keep in place until callers migrate; remove in a follow-up sweep.
export const lectures = LECTURES;
