import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSession, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";

export function LoginView() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!id.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("instructors")
      .select("id, name, is_alto_mando, can_delete, can_emit_rnap")
      .eq("id", id.trim())
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      toast.error("ID no encontrado");
      return;
    }

    const sess = {
      id: data.id,
      name: data.name,
      is_alto_mando: data.is_alto_mando,
      can_delete: data.is_alto_mando || !!data.can_delete,
      can_emit_rnap: data.is_alto_mando || !!data.can_emit_rnap,
    };

    setSession(sess);

    await logAction(supabase, sess, "LOGIN", {
      id: sess.id,
    });

    toast.success(`Bienvenido, ${data.name}`);
  }

  return (
    <div className="relative min-h-screen bg-slate-100">
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white border border-blue-200 border-b-0 px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-blue-200 px-3 py-1 text-xs text-slate-500 font-mono truncate">
              www.sapd.gov/instructor-login
            </div>
            <div className="flex gap-1">
              <span className="w-6 h-6 bg-slate-100 border border-blue-200 flex items-center justify-center text-slate-500 text-xs">◀</span>
              <span className="w-6 h-6 bg-slate-100 border border-blue-200 flex items-center justify-center text-slate-500 text-xs">▶</span>
            </div>
          </div>

          <Card className="w-full overflow-hidden rounded-none border border-blue-200 bg-white shadow-sm">
            <div className="h-1 bg-blue-600"></div>

            <div className="bg-white border-b border-blue-200 px-6 py-5 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white border border-blue-200 p-1">
                  <img src={sapdLogo.url} alt="SAPD" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-blue-700 font-display font-extrabold text-3xl tracking-wider">
                    SAPD
                  </h1>
                  <p className="text-slate-500 text-[10px] tracking-[0.3em] uppercase mt-1">
                    Instructor Profile Database
                  </p>
                </div>
              </div>
              <div className="text-blue-600 text-4xl font-black">?</div>
            </div>

            <div className="bg-slate-50 border-b border-blue-200 px-6 py-3 flex justify-around text-slate-600 font-display font-bold uppercase text-sm tracking-wider">
              <span>A - E</span>
              <span>F - J</span>
              <span className="text-blue-700">K - O</span>
              <span>P - U</span>
              <span>V - Z</span>
            </div>

            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 border border-blue-200">
                  <img
                    src={sapdLogo.url}
                    alt="SAPD"
                    className="w-36 h-36 object-contain"
                  />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-blue-600 text-xs tracking-[0.35em] uppercase font-semibold">
                  San Andreas State
                </h2>
                <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-wide text-slate-900 font-display">
                  Police Department
                </h1>
                <div className="mx-auto mt-5 mb-5 h-px w-32 bg-blue-600"></div>
                <p className="text-slate-500 text-sm tracking-wider">
                  Instructor Management System
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                <Input
                  placeholder="Ingrese su ID de Instructor"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  autoFocus
                  className="
                    h-12
                    rounded-none
                    border
                    border-blue-300
                    bg-white
                    text-center
                    text-lg
                    text-slate-800
                    placeholder:text-slate-400
                    focus:border-blue-600
                    focus:ring-2
                    focus:ring-blue-600/20
                    transition-all
                  "
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    h-12
                    w-full
                    rounded-none
                    bg-blue-600
                    text-white
                    font-semibold
                    tracking-wider
                    transition-all
                    duration-200
                    hover:bg-blue-700
                    hover:scale-[1.01]
                    active:scale-[0.99]
                  "
                >
                  {loading ? "VERIFICANDO..." : "INGRESAR AL SISTEMA"}
                </Button>
              </form>

              <div className="mt-8">
                <div className="border-t border-blue-200 pt-5">
                  <p className="text-center text-xs uppercase tracking-[0.25em] text-slate-500">
                    Web Management System
                  </p>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Acceso exclusivo para personal autorizado.
                  </p>
                  <p className="mt-1 text-center text-[10px] text-slate-400">
                    SAN ANDREAS POLICE DEPARTMENT © 2026
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
