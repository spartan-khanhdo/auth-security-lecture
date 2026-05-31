"use client"; // "use client" — uses useState, useEffect, Supabase browser client

import { useState, useEffect, useCallback, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export interface AdminScoreRow {
  id: string;
  player_name: string;
  lecture_slug: string;
  score: number;
  total: number;
  created_at: string;
  session_id: string | null;
  room_code: string | null;
  session_created_at: string | null;
}

type LeaderboardFilter = "all" | "today" | string; // string = lecture slug

interface UseAdminLeaderboardReturn {
  rows: AdminScoreRow[];
  isLoading: boolean;
  filter: LeaderboardFilter;
  setFilter: (f: LeaderboardFilter) => void;
  refresh: () => Promise<void>;
  deleteScore: (id: string) => Promise<void>;
  lastRefreshed: Date | null;
}

// Raw row returned from Supabase — shape is unknown at compile time
interface RawScoreRow {
  id: string;
  player_name?: string;
  name?: string;
  lecture_slug?: string;
  score?: number;
  total?: number;
  created_at?: string;
  session_id?: string | null;
  quiz_sessions?: { room_code?: string; created_at?: string } | null;
}

function mapRawRow(r: RawScoreRow): AdminScoreRow {
  return {
    id: r.id,
    player_name: r.player_name ?? r.name ?? "",
    lecture_slug: r.lecture_slug ?? "",
    score: r.score ?? 0,
    total: r.total ?? 0,
    created_at: r.created_at ?? "",
    session_id: r.session_id ?? null,
    room_code: r.quiz_sessions?.room_code ?? null,
    session_created_at: r.quiz_sessions?.created_at ?? null,
  };
}

export function useAdminLeaderboard(): UseAdminLeaderboardReturn {
  const [rows, setRows] = useState<AdminScoreRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<LeaderboardFilter>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      // Attempt join with quiz_sessions. If FK doesn't exist, fall back gracefully.
      const { data, error } = await supabase
        .from("quiz_scores")
        .select("*, quiz_sessions(room_code, created_at)")
        .order("score", { ascending: false });

      if (error) {
        // Try without join
        const fallback = await supabase
          .from("quiz_scores")
          .select("*")
          .order("score", { ascending: false });

        if (!fallback.error && fallback.data) {
          const mapped = (fallback.data as RawScoreRow[]).map(mapRawRow);
          setRows(applyFilter(mapped, filter));
        }
      } else if (data) {
        const mapped = (data as RawScoreRow[]).map(mapRawRow);
        setRows(applyFilter(mapped, filter));
      }

      setLastRefreshed(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 10s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refresh();
    }, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  async function deleteScore(id: string) {
    // Optimistic remove
    setRows((prev) => prev.filter((r) => r.id !== id));
    const supabase = createSupabaseBrowserClient();
    await supabase.from("quiz_scores").delete().eq("id", id);
    // Note: no rollback — admin intentional delete
  }

  return {
    rows,
    isLoading,
    filter,
    setFilter,
    refresh,
    deleteScore,
    lastRefreshed,
  };
}

function applyFilter(rows: AdminScoreRow[], filter: LeaderboardFilter): AdminScoreRow[] {
  if (filter === "all") return rows;
  if (filter === "today") {
    const todayStr = new Date().toISOString().slice(0, 10);
    return rows.filter((r) => r.created_at.startsWith(todayStr));
  }
  // lecture slug filter
  return rows.filter((r) => r.lecture_slug === filter);
}
