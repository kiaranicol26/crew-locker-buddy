import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { useSessionState, type Session } from "@/lib/session";

export function Protected({
  altoMando = false,
  children,
}: {
  altoMando?: boolean;
  children: (session: Session) => ReactNode;
}) {
  const { session, ready } = useSessionState();

  if (!ready) return <div className="min-h-screen bg-slate-200" />;

  if (!session || (altoMando && !session.is_alto_mando)) {
    return (
      <AppShell session={session}>
        <Card className="border-2 border-blue-300 bg-white rounded-none max-w-xl mx-auto">
          <div className="p-8 text-center space-y-4">
            <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">
              {session ? "Acceso solo para Alto Mando" : "Necesitas iniciar sesión"}
            </p>
            {!session && (
              <Button asChild className="rounded-none bg-blue-700 hover:bg-blue-800 text-white font-bold">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            )}
          </div>
        </Card>
      </AppShell>
    );
  }

  return <AppShell session={session}>{children(session)}</AppShell>;
}
