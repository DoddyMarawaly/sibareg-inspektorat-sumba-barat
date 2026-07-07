"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";

/**
 * Hook untuk mengambil sesi login & profil (peran) pengguna saat ini.
 * Mengarahkan ke /login jika belum masuk.
 */
export function useProfile({ redirectIfNoSession = true } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!currentSession) {
        setSession(null);
        setProfile(null);
        setLoading(false);
        if (redirectIfNoSession) router.replace("/login");
        return;
      }

      setSession(currentSession);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentSession.user.id)
        .single();

      if (isMounted) {
        setProfile(profileData || null);
        setLoading(false);
      }
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession && redirectIfNoSession) {
        router.replace("/login");
      }
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, session, profile };
}
