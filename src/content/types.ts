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
    | 'StorageAttackMatrix';
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

export interface Lecture {
  slug:
    | 'oauth-authn'
    | 'jwt-best-practices'
    | 'service-to-service'
    | 'security-fundamentals'
    | 'gaps';
  title: string;
  subtitle: string;
  estMinutes: number;
  topics: string[];
  units: Unit[];
}
