/**
 * questions-admin.ts
 *
 * CRUD helpers for admin question management.
 * Uses the Supabase browser client — admin writes are triggered from Client
 * Components while the user holds an authenticated session cookie.
 * RLS policy "admin write" (FOR ALL USING auth.role() = 'authenticated')
 * enforces access automatically.
 *
 * Admin account email: stored in Supabase Auth → Users (not committed here).
 * All functions return { data, error } and never throw — callers handle errors.
 */

import { PostgrestError } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Question, QuestionInsert } from '@/content/types';

// ---------------------------------------------------------------------------
// addQuestion
// ---------------------------------------------------------------------------

/**
 * INSERT a new question row and return the inserted record.
 */
export async function addQuestion(
  payload: QuestionInsert
): Promise<{ data: Question | null; error: PostgrestError | null }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('questions')
    .insert(payload)
    .select('*')
    .single();

  return { data: (data as Question | null), error };
}

// ---------------------------------------------------------------------------
// updateQuestion
// ---------------------------------------------------------------------------

/**
 * UPDATE an existing question by id and return the updated record.
 * Automatically sets updated_at to the current timestamp.
 */
export async function updateQuestion(
  id: string,
  payload: Partial<QuestionInsert>
): Promise<{ data: Question | null; error: PostgrestError | null }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('questions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: (data as Question | null), error };
}

// ---------------------------------------------------------------------------
// deleteQuestion
// ---------------------------------------------------------------------------

/**
 * DELETE a question by id.
 */
export async function deleteQuestion(
  id: string
): Promise<{ error: PostgrestError | null }> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  return { error };
}

// ---------------------------------------------------------------------------
// reorderQuestions
// ---------------------------------------------------------------------------

/**
 * Batch-update order_idx for multiple questions in a single round-trip.
 * Uses upsert with onConflict: 'id' so only the order_idx column changes.
 * Safe for up to ~50 questions (the expected cap for this course).
 */
export async function reorderQuestions(
  updates: Array<{ id: string; order_idx: number }>
): Promise<{ error: PostgrestError | null }> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('questions')
    .upsert(updates, { onConflict: 'id' });

  return { error };
}
