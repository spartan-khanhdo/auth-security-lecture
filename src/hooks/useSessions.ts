"use client"; // "use client" — uses useState, useEffect, Supabase browser client

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export interface QuizSession {
  id: string;
  room_code: string;
  status: "lobby" | "active" | "ended" | string;
  created_at: string;
  participant_count: number;
}

// Raw shape returned by Supabase
interface RawSession {
  id: string;
  room_code?: string;
  status?: string;
  created_at?: string;
  quiz_participants?: Array<{ count: number }> | { count: number } | null;
}

interface UseSessionsReturn {
  sessions: QuizSession[];
  isLoading: boolean;
  endSession: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*, quiz_participants(count)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: QuizSession[] = (data as RawSession[]).map((row) => {
          let participantCount = 0;
          if (Array.isArray(row.quiz_participants)) {
            participantCount = row.quiz_participants[0]?.count ?? 0;
          } else if (row.quiz_participants && typeof row.quiz_participants === "object") {
            participantCount = (row.quiz_participants as { count: number }).count ?? 0;
          }
          return {
            id: row.id,
            room_code: row.room_code ?? "",
            status: row.status ?? "ended",
            created_at: row.created_at ?? "",
            participant_count: participantCount,
          };
        });
        setSessions(mapped);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function endSession(id: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("quiz_sessions")
      .update({ status: "ended" })
      .eq("id", id);

    if (!error) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "ended" } : s))
      );
    }
  }

  return { sessions, isLoading, endSession, refetch };
}
