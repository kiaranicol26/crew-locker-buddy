import { useEffect, useState } from "react";

export type Session = {
  id: string;
  name: string;
  is_alto_mando: boolean;
  can_delete: boolean;
  can_emit_rnap: boolean;
};

const KEY = "instructor_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("session-change"));
}

export function useSessionState() {
  const [session, setSess] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSess(getSession());
    setReady(true);
    const h = () => setSess(getSession());
    window.addEventListener("session-change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("session-change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return { session, ready };
}

export function useSession() {
  return useSessionState().session;
}


export async function logAction(
  supabase: any,
  session: Session | null,
  action: string,
  details?: Record<string, unknown>,
) {
  try {
    await supabase.from("logs").insert({
      instructor_id: session?.id ?? null,
      instructor_name: session?.name ?? null,
      action,
      details: details ?? null,
    });
  } catch (e) {
    console.error("log failed", e);
  }
}