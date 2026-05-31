"use client"; // "use client" — uses useState, useEffect, Supabase browser client

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { QuizSession } from "@/hooks/useSessions";

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  avatar_url: string | null;
  score: number | null;
  joined_at: string;
}

export interface Answer {
  id: string;
  participant_id: string;
  question_id: string;
  selected_idx: number;
  is_correct: boolean;
  answered_at: string;
}

// Raw Supabase row shapes
interface RawSession {
  id: string;
  room_code?: string;
  status?: string;
  created_at?: string;
}

interface RawParticipant {
  id: string;
  session_id?: string;
  name?: string;
  player_name?: string;
  avatar_url?: string | null;
  score?: number | null;
  joined_at?: string;
  created_at?: string;
}

interface RawAnswer {
  id: string;
  participant_id?: string;
  question_id?: string;
  selected_idx?: number;
  answer_idx?: number;
  is_correct?: boolean;
  answered_at?: string;
  created_at?: string;
}

interface UseSessionDetailReturn {
  session: QuizSession | null;
  participants: Participant[];
  answers: Answer[];
  isLoading: boolean;
  error: string | null;
}

export function useSessionDetail(sessionId: string): UseSessionDetailReturn {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseBrowserClient();

        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from("quiz_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        const s = sessionData as RawSession;
        setSession({
          id: s.id,
          room_code: s.room_code ?? "",
          status: s.status ?? "ended",
          created_at: s.created_at ?? "",
          participant_count: 0,
        });

        // Fetch participants
        const { data: participantsData } = await supabase
          .from("quiz_participants")
          .select("*")
          .eq("session_id", sessionId);

        const mapped: Participant[] = ((participantsData as RawParticipant[]) ?? []).map((p) => ({
          id: p.id,
          session_id: p.session_id ?? sessionId,
          name: p.name ?? p.player_name ?? "",
          avatar_url: p.avatar_url ?? null,
          score: p.score ?? null,
          joined_at: p.joined_at ?? p.created_at ?? "",
        }));
        setParticipants(mapped);

        // Fetch answers for all participants in this session
        const participantIds = mapped.map((p) => p.id);
        if (participantIds.length > 0) {
          const { data: answersData } = await supabase
            .from("quiz_answers")
            .select("*")
            .in("participant_id", participantIds);

          const mappedAnswers: Answer[] = ((answersData as RawAnswer[]) ?? []).map((a) => ({
            id: a.id,
            participant_id: a.participant_id ?? "",
            question_id: a.question_id ?? "",
            selected_idx: a.selected_idx ?? a.answer_idx ?? 0,
            is_correct: a.is_correct ?? false,
            answered_at: a.answered_at ?? a.created_at ?? "",
          }));
          setAnswers(mappedAnswers);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, [sessionId]);

  return { session, participants, answers, isLoading, error };
}
