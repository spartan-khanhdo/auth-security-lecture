export type UnitType = 'prose' | 'diagram' | 'demo' | 'code' | 'quiz' | 'media' | 'two-column' | 'checkpoint';

export interface BaseUnit {
  id: string;
  type: UnitType;
  title?: string;
}

export interface ProseUnit extends BaseUnit {
  type: 'prose';
  body: string;
  callouts?: Array<{ tone: 'info' | 'warn' | 'danger'; text: string }>;
  learnMore?: Array<{ label: string; url: string }>;
}

export interface DiagramUnit extends BaseUnit {
  type: 'diagram';
  mermaid: string;
  caption?: string;
}

export interface DemoUnit extends BaseUnit {
  type: 'demo';
  component:
    | 'JWTDecoder'
    | 'JWTForger'
    | 'PKCEGenerator'
    | 'OAuthFlowPlayer'
    | 'PKCESimulator'
    | 'RBACPlayground'
    | 'CSRFSandbox'
    | 'HashingPlayground'
    | 'SQLiSandbox'
    | 'XSSSandbox'
    | 'DecisionTracer'
    | 'TokenLifetimeVisualizer'
    | 'StorageAttackMatrix'
    | 'MTLSVisualizer';
  props?: Record<string, unknown>;
}

export interface CodeUnit extends BaseUnit {
  type: 'code';
  language: 'ts' | 'js' | 'py' | 'sql' | 'yaml' | 'java' | 'bash' | 'json';
  code: string;
  annotations?: Array<{ line: number; note: string }>;
}

export interface QuizUnit extends BaseUnit {
  type: 'quiz';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  choices: Array<{ id: string; label: string }>;
  correctChoiceId: string;
  explanation: string;
  points?: number;
}

/**
 * A static image, animated GIF, or video clip embedded in a lecture slide.
 *
 * `kind: 'image'` — rendered with next/image (optimized, lazy-loaded).
 * `kind: 'gif'`   — rendered with a native <img> tag to preserve animation.
 *                   ⚠ Not optimized by Next.js; keep GIF files ≤ 2 MB.
 * `kind: 'video'` — rendered with a native <video> element.
 *
 * `src` — path relative to /public (e.g. '/media/pkce-flow.gif') or an
 *          absolute URL. For video, external URLs (CDN, S3) are fine.
 *
 * `alt` — required for informational images/GIFs; pass '' for decorative.
 */
export interface MediaUnit extends BaseUnit {
  type: 'media';
  src: string;
  kind: 'image' | 'gif' | 'video';
  alt?: string;
  caption?: string;
  /** CSS aspect-ratio value, e.g. '16/9', '4/3', '1/1'. Defaults: image/gif → 'auto', video → '16/9' */
  aspectRatio?: string;
}

/**
 * A single-step quiz block containing one or more questions.
 * Renders all questions on one scrollable screen so the learner completes
 * the entire checkpoint in one player step — no per-question step navigation.
 *
 * Use this instead of individual `quiz` units at the end of a lecture.
 * The `quiz` type is reserved for standalone inline quiz questions.
 */
export interface CheckpointUnit extends BaseUnit {
  type: 'checkpoint';
  /** All quiz questions shown together on this slide. */
  questions: QuizUnit[];
}

/** Leaf unit types that can appear inside a TwoColumnUnit (no recursive nesting). */
export type LeafUnit = ProseUnit | DiagramUnit | DemoUnit | CodeUnit | QuizUnit | MediaUnit;

/**
 * Renders two units side-by-side. Collapses to a single column on mobile.
 *
 * `left` and `right` accept any unit type except TwoColumnUnit itself —
 * nesting split layouts is not supported.
 *
 * `ratio` controls the CSS grid column widths (left : right):
 *   '1:1' (default) → equal columns
 *   '2:3'           → left narrower, right wider
 *   '3:2'           → left wider, right narrower
 */
export interface TwoColumnUnit extends BaseUnit {
  type: 'two-column';
  left: LeafUnit;
  right: LeafUnit;
  ratio?: '1:1' | '2:3' | '3:2';
}

export type Unit = ProseUnit | DiagramUnit | DemoUnit | CodeUnit | QuizUnit | MediaUnit | TwoColumnUnit | CheckpointUnit;

export type LectureSlug =
  | 'oauth-authn'
  | 'jwt-best-practices'
  | 'sessions-mfa-modern-authn'
  | 'service-to-service'
  | 'security-fundamentals'
  | 'gaps';

export interface Lecture {
  slug: LectureSlug;
  title: string;
  subtitle: string;
  /** Short marketing line shown on the syllabus card (distinct from subtitle) */
  tagline: string;
  estMinutes: number;
  topics: string[];
  units: Unit[];
  /** Accent color for the card icon badge */
  color: 'teal' | 'indigo' | 'purple' | 'pink' | 'amber' | 'green';
  /** SVG icon key for LectureCardIcon */
  iconKey: 'swap' | 'key' | 'layers' | 'server' | 'shield' | 'puzzle';
  /** When true the card renders as muted "Coming soon" (non-interactive) */
  comingSoon: boolean;
}

// ---------------------------------------------------------------------------
// Supabase `questions` table types
// Used by src/lib/questions-admin.ts (admin CRUD) and the quiz engine.
// ---------------------------------------------------------------------------

export interface QuestionInsert {
  lecture_slug: LectureSlug;
  question: string;
  options: string[];     // exactly 4 items
  correct_idx: number;   // 0–3
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order_idx: number;
}

export interface Question extends QuestionInsert {
  id: string;
  created_at: string;
  updated_at: string;
}
