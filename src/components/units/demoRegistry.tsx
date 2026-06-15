import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { DemoUnit } from '@/content/types';

/** Minimal shimmer shown while a demo chunk loads. */
function DemoSkeleton() {
  return (
    <div className="min-h-[20rem] w-full rounded-md animate-pulse bg-muted" />
  );
}

/**
 * Maps every DemoUnit['component'] key to a lazily loaded stub/real component.
 * TypeScript enforces via Record<DemoUnit['component'], ...> that all 13 keys
 * are present — adding a new key to DemoUnit['component'] in types.ts will
 * fail compilation here until a matching entry is added.
 */
export const demoRegistry: Record<
  DemoUnit['component'],
  ComponentType<Record<string, unknown>>
> = {
  AuthNAuthZAnimator: dynamic(
    () => import('@/components/demos/AuthNAuthZAnimator'),
    { ssr: false, loading: DemoSkeleton }
  ),
  SessionFlowLane: dynamic(
    () => import('@/components/demos/SessionFlowLane'),
    { ssr: false, loading: DemoSkeleton }
  ),
  PasswordProgression: dynamic(
    () => import('@/components/demos/PasswordProgression'),
    { ssr: false, loading: DemoSkeleton }
  ),
  JWTDecoder: dynamic(
    () => import('@/components/demos/JWTDecoder'),
    { ssr: false, loading: DemoSkeleton }
  ),
  JWTForger: dynamic(
    () => import('@/components/demos/JWTForger'),
    { ssr: false, loading: DemoSkeleton }
  ),
  PKCEGenerator: dynamic(
    () => import('@/components/demos/PKCEGenerator'),
    { ssr: false, loading: DemoSkeleton }
  ),
  OAuthFlowPlayer: dynamic(
    () => import('@/components/demos/OAuthFlowPlayer'),
    { ssr: false, loading: DemoSkeleton }
  ),
  PKCESimulator: dynamic(
    () => import('@/components/demos/PKCESimulator'),
    { ssr: false, loading: DemoSkeleton }
  ),
  RBACPlayground: dynamic(
    () => import('@/components/demos/RBACPlayground'),
    { ssr: false, loading: DemoSkeleton }
  ),
  CSRFSandbox: dynamic(
    () => import('@/components/demos/CSRFSandbox'),
    { ssr: false, loading: DemoSkeleton }
  ),
  HashingPlayground: dynamic(
    () => import('@/components/demos/HashingPlayground'),
    { ssr: false, loading: DemoSkeleton }
  ),
  SQLiSandbox: dynamic(
    () => import('@/components/demos/SQLiSandbox'),
    { ssr: false, loading: DemoSkeleton }
  ),
  XSSSandbox: dynamic(
    () => import('@/components/demos/XSSSandbox'),
    { ssr: false, loading: DemoSkeleton }
  ),
  DecisionTracer: dynamic(
    () => import('@/components/demos/DecisionTracer'),
    { ssr: false, loading: DemoSkeleton }
  ),
  TokenLifetimeVisualizer: dynamic(
    () => import('@/components/demos/TokenLifetimeVisualizer'),
    { ssr: false, loading: DemoSkeleton }
  ),
  StorageAttackMatrix: dynamic(
    () => import('@/components/demos/StorageAttackMatrix'),
    { ssr: false, loading: DemoSkeleton }
  ),
  MTLSVisualizer: dynamic(
    () => import('@/components/demos/MTLSVisualizer'),
    { ssr: false, loading: DemoSkeleton }
  ),
  MFAVerificationDemo: dynamic(
    () => import('@/components/demos/MFAVerificationDemo'),
    { ssr: false, loading: DemoSkeleton }
  ),
};
