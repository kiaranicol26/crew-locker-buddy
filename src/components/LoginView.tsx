import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setSession, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import policeBg from "@/assets/police-bg.jpg.asset.json";

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
    <div className="relative min-h-screen overflow-hidden bg-[#050b16]">
      {/* Police car background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${policeBg.url})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050b16]/70 via-[#07101c]/90 to-[#050b16]" />

      <div className="relative flex min-h-screen items-center justify-center p-6">

        <div className="w-full max-w-2xl">
          {/* LCPD-style browser chrome */}
          <div className="rounded-t-md bg-slate-800 border border-slate-700 border-b-0 px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-xs text-slate-400 font-mono truncate">
              www.sapd.gov/instructor-login
            </div>
            <div className="flex gap-1">
              <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-400 text-xs">◀</span>
              <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-400 text-xs">▶</span>
            </div>
          </div>

        <Card className="w-full overflow-hidden rounded-b-md rounded-t-none border border-blue-900/50 bg-slate-950/95 shadow-[0_0_45px_rgba(0,0,0,.7)]">

          {/* Barra superior amarilla LCPD */}
          <div className="h-2 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500"></div>

          {/* Banner LCPD-style */}
          <div className="bg-slate-900 border-b border-yellow-400/30 px-6 py-5 flex items-center justify-between gap-6">
            <div>
              <h1 className="text-yellow-400 font-display font-extrabold text-3xl tracking-wider">
                SAPD
              </h1>
              <div className="mt-1 border-t-2 border-yellow-400 w-24"></div>
              <p className="text-white text-[10px] tracking-[0.3em] uppercase mt-1">
                Instructor Profile Database
              </p>
            </div>
            <div className="text-yellow-400/80 text-4xl">?</div>
          </div>

          {/* Barra de letras LCPD */}
          <div className="bg-slate-900/70 border-b border-slate-700 px-6 py-3 flex justify-around text-slate-400 font-display font-bold uppercase text-sm tracking-wider">
            <span>A - E</span>
            <span>F - J</span>
            <span className="text-yellow-300">K - O</span>
            <span>P - U</span>
            <span>V - Z</span>
          </div>

          <div className="p-8">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-slate-800 p-4 shadow-xl border border-slate-700">
                <img
                  src="https://i.ibb.co/kssC1q9Q/Adobe-Express-file.png"
                  alt="SAPD"
                  className="w-36 h-36 object-contain"
                />
              </div>
            </div>

            {/* Encabezado */}

            <div className="text-center">

              <h2 className="text-blue-300 text-xs tracking-[0.35em] uppercase font-semibold">
                San Andreas State
              </h2>

              <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-wide text-white font-display">
                Police Department
              </h1>

              <div className="mx-auto mt-5 mb-5 h-px w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

              <p className="text-slate-300 text-sm tracking-wider">
                Instructor Management System
              </p>

            </div>

            {/* Formulario */}

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
                  rounded
                  border
                  border-slate-700
                  bg-slate-800
                  text-center
                  text-lg
                  text-white
                  placeholder:text-slate-500
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/30
                  transition-all
                "
              />

              <Button
                type="submit"
                disabled={loading}
                className="
                  h-12
                  w-full
                  rounded
                  bg-blue-800
                  text-white
                  font-semibold
                  tracking-wider
                  transition-all
                  duration-200
                  hover:bg-blue-700
                  hover:scale-[1.01]
                  active:scale-[0.99]
                  shadow-lg
                  shadow-blue-950/50
                "
              >
                {loading ? "VERIFICANDO..." : "INGRESAR AL SISTEMA"}
              </Button>

            </form>

            {/* Información */}

            <div className="mt-8">

              <div className="border-t border-slate-700 pt-5">

                <p className="text-center text-xs uppercase tracking-[0.25em] text-slate-400">
                  Web Management System
                </p>

                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Acceso exclusivo para personal autorizado.
                </p>

                <p className="mt-1 text-center text-[10px] text-slate-600">
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
