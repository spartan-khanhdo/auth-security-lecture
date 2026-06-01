import type { Lecture } from "@/content/types";
import { oauthAuthn } from "./oauth-authn";
import { jwtBestPractices } from "./jwt-best-practices";
import { sessionsMfaModernAuthn } from "./sessions-mfa-modern-authn";
import { serviceToService } from "./service-to-service";
import { securityFundamentals } from "./security-fundamentals";
import { gaps } from "./gaps";

export type LectureSlug = Lecture["slug"];

export const LECTURES: Lecture[] = [
  oauthAuthn,              // position 1
  jwtBestPractices,        // position 2
  sessionsMfaModernAuthn,  // position 3 — new
  serviceToService,        // position 4 (was 3)
  securityFundamentals,    // position 5 (was 4)
  gaps,                    // position 6 (was 5)
];

export const LECTURES_BY_SLUG: Record<LectureSlug, Lecture> = {
  "oauth-authn": oauthAuthn,
  "jwt-best-practices": jwtBestPractices,
  "sessions-mfa-modern-authn": sessionsMfaModernAuthn,
  "service-to-service": serviceToService,
  "security-fundamentals": securityFundamentals,
  gaps: gaps,
};

// Backward-compatible alias — LectureSyllabus.tsx imports `lectures` (lowercase).
// Keep in place until callers migrate; remove in a follow-up sweep.
export const lectures = LECTURES;
