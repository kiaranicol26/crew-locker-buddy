import { createFileRoute } from "@tanstack/react-router";
import { useSession, setSession, logAction } from "@/lib/session";
import { LoginView } from "@/components/LoginView";
import { RecordsTable } from "@/components/RecordsTable";
import { AspirantesTable } from "@/components/AspirantesTable";
import { AltoMando } from "@/components/AltoMando";
import { RnapView } from "@/components/RnapView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield } from "lucide-react";
import { useState } from "react";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestión de la Policía · SAPD" },
      { name: "description", content: "Sistema interno del San Andreas Police Department" },
    ],
  }),
  component: Index,
});

function Index() {
  const session = useSession();
  const [tab, setTab] = useState<"records" | "aspirantes" | "rnap" | "alto">("records");

  if (!session) return <LoginView />;

  async function handleLogout() {
    await logAction(supabase, session, "LOGOUT");
    setSession(null);
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "records", label: "EX POLICÍAS" },
    { key: "aspirantes", label: "ASPIRANTES" },
    { key: "rnap", label: "R.N.A.P" },
    ...(session.is_alto_mando ? [{ key: "alto" as const, label: "ALTO MANDO" }] : []),
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0b1526] via-[#101d31] to-[#0a1120]">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,.10),transparent_60%)]" />
      <div className="relative">
      <header className="border-b border-slate-700/60 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white font-display">
              Gestión de la Policía
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {session.id} · {session.name}
              {session.is_alto_mando && (
                <span className="ml-2 inline-flex items-center gap-1 text-yellow-400">
                  <Shield className="w-3 h-3" /> Alto Mando
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}
            className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800">
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>

        {/* LCPD-style nav */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-stretch gap-0 border-t-2 border-yellow-400/80">
            {tabs.map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`
                    relative flex-1 px-6 py-3 font-display font-bold uppercase tracking-[0.25em] text-sm
                    transition-all border-r border-slate-700/50 last:border-r-0
                    ${active
                      ? "text-yellow-300 bg-slate-800/80"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"}
                  `}
                >
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-yellow-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {tab === "records" && <RecordsTable session={session} />}
        {tab === "aspirantes" && <AspirantesTable session={session} />}
        {tab === "rnap" && <RnapView session={session} />}
        {tab === "alto" && session.is_alto_mando && <AltoMando session={session} />}
      </main>
      </div>
    </div>
  );
}