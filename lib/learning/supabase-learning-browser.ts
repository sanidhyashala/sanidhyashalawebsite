"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function useLearningSupabaseBrowser(): SupabaseClient {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => {
          if (typeof window === "undefined") {
            return null;
          }

          try {
            return (await getToken()) ?? null;
          } catch (error) {
            console.error(
              "Failed to get Clerk token for Supabase:",
              error
            );

            return null;
          }
        },
      }
    );
  }, [getToken]);

  return supabase;
}