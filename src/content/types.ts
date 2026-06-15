export type UnitType = 'prose' | 'diagram' | 'demo' | 'code' | 'quiz' | 'media' | 'two-column' | 'checkpoint' | 'section' | 'takeaways';

export interface BaseUnit {
  id: string;
  type: UnitType;
  title?: string;
  /** Lucide icon key, e.g. 'Key', 'Lock', 'Shield'. Rendered in the slide title. */
  icon?: string;
  /** CSS color or var() token for the icon, e.g. 'var(--amber)'. Defaults to var(--primary-2). */
  iconColor?: string;
  /**
   * Small kicker/eyebrow shown above the title on the slide so the learner
   * always knows which topic this step belongs to (e.g. "§ 3.3 · Client
   * Credentials"). Rendered by StepHeader via UnitRenderer when present.
   */
  section?: string;
}

/** A column within a ComparePair block. */
export interface ProseCompareColumn {
  title: string;
  bullets: string[];
  tone?: 'good' | 'bad' | 'neutral';
}

/**
 * Rich inline block that can appear inside a ProseUnit.
 * Each variant maps to a block component in src/components/units/blocks/.
 */
export interface FactorCardData {
  icon: string;
  color: string;
  category: string;
  description: string;
  examples: string[];
}

export interface AppCardData {
  name: string;
  note: string;
  color: string;   // CSS var or hex — used as accent color
  logo: string;    // path relative to /public, e.g. '/icons/brands/authy.svg'
}

export interface FlowStepData {
  icon?: string;        // Lucide icon name
  label: string;        // short heading shown inside the block
  description: string;  // one-line detail below the label
}

export type ProseBlock =
  | { type: 'keypoint'; label: string; title: string; body: string; accent?: 'primary' | 'blue' | 'amber' | 'red' | 'green' }
  | { type: 'compare'; left: ProseCompareColumn; right: ProseCompareColumn }
  | { type: 'mistake'; mistake: string; risk: string }
  | { type: 'factor-cards'; factors: FactorCardData[] }
  | { type: 'app-cards'; apps: AppCardData[] }
  | { type: 'media-row'; items: Array<{ src: string; alt?: string; caption?: string }> }
  | { type: 'youtube'; videoId: string; caption?: string }
  | { type: 'flow-steps'; steps: FlowStepData[] };

export interface ProseUnit extends BaseUnit {
  type: 'prose';
  body: string;
  /** Optional image rendered between the body and callouts. */
  image?: { src: string; alt?: string; caption?: string };
  callouts?: Array<{ tone: 'info' | 'warn' | 'danger' | 'success'; text: string }>;
  learnMore?: Array<{ label: string; url: string }>;
  /** Optional key takeaway displayed after the body segments. */
  takeaway?: string;
  /** Optional rich blocks rendered after the takeaway. */
  blocks?: ProseBlock[];
}

export interface DiagramUnit extends BaseUnit {
  type: 'diagram';
  mermaid: string;
  caption?: string;
}

export interface DemoUnit extends BaseUnit {
  type: 'demo';
  component:
  | 'AuthNAuthZAnimator'
  | 'SessionFlowLane'
  | 'PasswordProgression'
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
  language: 'ts' | 'js' | 'py' | 'sql' | 'yaml' | 'java' | 'kotlin' | 'bash' | 'json';
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

export interface SectionUnit extends BaseUnit {
  type: 'section';
  // title is inherited from BaseUnit — required for section slides
  subtitle?: string;
}

export interface TakeawaysUnit extends BaseUnit {
  type: 'takeaways';
  items: string[];
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
  /** When 'column', renders left then right stacked in a single column at all breakpoints. */
  direction?: 'row' | 'column';
}

export type Unit = ProseUnit | DiagramUnit | DemoUnit | CodeUnit | QuizUnit | MediaUnit | TwoColumnUnit | CheckpointUnit | SectionUnit | TakeawaysUnit;

export type LectureSlug =
  | 'oauth-authn'
  | 'oauth'
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
