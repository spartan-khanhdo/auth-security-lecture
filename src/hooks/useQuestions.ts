"use client"; // "use client" — uses useState, useEffect, Supabase browser client

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Question } from "@/content/types";

interface UseQuestionsReturn {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addOptimistic: (q: Question) => void;
  updateOptimistic: (q: Question) => void;
  removeOptimistic: (id: string) => void;
  reorderOptimistic: (updated: Question[]) => void;
}

export function useQuestions(): UseQuestionsReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("*")
        .order("lecture_slug")
        .order("order_idx");

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setQuestions((data as Question[]) ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function addOptimistic(q: Question) {
    setQuestions((prev) => [...prev, q]);
  }

  function updateOptimistic(q: Question) {
    setQuestions((prev) => prev.map((existing) => (existing.id === q.id ? q : existing)));
  }

  function removeOptimistic(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function reorderOptimistic(updated: Question[]) {
    setQuestions((prev) => {
      // Replace all items that appear in `updated` slice, preserve rest
      const updatedIds = new Set(updated.map((q) => q.id));
      const others = prev.filter((q) => !updatedIds.has(q.id));
      return [...others, ...updated].sort((a, b) => {
        if (a.lecture_slug < b.lecture_slug) return -1;
        if (a.lecture_slug > b.lecture_slug) return 1;
        return a.order_idx - b.order_idx;
      });
    });
  }

  return {
    questions,
    isLoading,
    error,
    refetch,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    reorderOptimistic,
  };
}
