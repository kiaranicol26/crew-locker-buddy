import { createFileRoute } from "@tanstack/react-router";
import { useSession, setSession, logAction } from "@/lib/session";
import { LoginView } from "@/components/LoginView";
import { RecordsTable } from "@/components/RecordsTable";
import { AspirantesTable } from "@/components/AspirantesTable";
import { AltoMando } from "@/components/AltoMando";
import { RnapView } from "@/components/RnapView";
import { SalarioView } from "@/components/SalarioView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield } from "lucide-react";
import { useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
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
    <div className="relative min-h-screen bg-slate-100">
      <div className="relative">
        <header className="border-b border-blue-200 bg-white">
          <div className="w-full px-4 lg:px-6 pt-4 pb-2 relative">
            {/* Compact centered branding */}
            <div className="flex flex-col items-center text-center">
              <p className="text-blue-700 text-[10px] lg:text-xs uppercase font-bold tracking-[0.35em]">
                San Andreas Police Department
              </p>
              <div className="flex items-center gap-3 mt-1">
                <img src={sapdLogo.url} alt="SAPD" className="w-10 h-10 object-contain" />
                <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-wide text-slate-900 font-display">
                  Welcome to <span className="text-blue-700">mySAPD</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                {session.id} · {session.name}
                {session.is_alto_mando && (
                  <span className="ml-2 inline-flex items-center gap-1 text-blue-700 font-semibold">
                    <Shield className="w-3 h-3" /> Alto Mando
                  </span>
                )}
              </p>
            </div>

            {/* Top-right actions */}
            <div className="absolute top-3 right-4 lg:right-6 flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-blue-600 text-white border border-blue-700">
                <span className="text-[11px] font-mono font-bold">K-105WZRP</span>
                <span className="text-[9px] uppercase tracking-wider opacity-90">Alto Mando</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}
                className="rounded-none border-blue-300 bg-white text-slate-700 hover:bg-blue-50 h-8">
                <LogOut className="w-4 h-4 mr-1" /> Salir
              </Button>
            </div>
          </div>

          <nav className="w-full px-4 lg:px-6">
            <div className="flex items-stretch gap-0 border-t-2 border-blue-600">
              {tabs.map(t => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`
                      relative flex-1 px-4 lg:px-6 py-3 font-display font-bold uppercase tracking-[0.2em] text-xs lg:text-sm
                      transition-all border-r border-blue-200 last:border-r-0
                      ${active
                        ? "text-blue-700 bg-blue-50"
                        : "text-slate-500 hover:text-blue-700 hover:bg-blue-50/50"}
                    `}
                  >
                    {t.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </header>

        <main className="w-full p-4 lg:p-6">
          {tab === "records" && <RecordsTable session={session} />}
          {tab === "aspirantes" && <AspirantesTable session={session} />}
          {tab === "rnap" && <RnapView session={session} />}
          {tab === "alto" && session.is_alto_mando && <AltoMando session={session} />}
        </main>
      </div>
    </div>
  );
}