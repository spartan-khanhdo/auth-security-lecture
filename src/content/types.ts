export type UnitType = 'prose' | 'diagram' | 'demo' | 'code' | 'quiz';

export interface BaseUnit {
  id: string;
  type: UnitType;
  title?: string;
}

export interface ProseUnit extends BaseUnit {
  type: 'prose';
  body: string;
  callouts?: Array<{ tone: 'info' | 'warn' | 'danger'; text: string }>;
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

export type Unit = ProseUnit | DiagramUnit | DemoUnit | CodeUnit | QuizUnit;

export type LectureSlug =
  | 'oauth-authn'
  | 'jwt-best-practices'
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
  color: 'teal' | 'indigo' | 'pink' | 'amber' | 'green';
  /** SVG icon key for LectureCardIcon */
  iconKey: 'swap' | 'key' | 'server' | 'shield' | 'puzzle';
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
