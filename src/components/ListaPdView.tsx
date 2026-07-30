import { useEffect, useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Users } from "lucide-react";

export type PdMember = {
  id: string;
  nombre: string;
  rango: string | null;
  created_at: string;
};

export function ListaPdView({ session }: { session: Session }) {
  const [members, setMembers] = useState<PdMember[]>([]);
  const [nombre, setNombre] = useState("");
  const [rango, setRango] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    const { data } = await supabase
      .from("pd_members")
      .select("*")
      .order("nombre", { ascending: true });
    if (data) setMembers(data as PdMember[]);
  }

  useEffect(() => { load(); }, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) return toast.error("Escribe el Nombre_Apellido");
    const { error } = await supabase.from("pd_members").insert({
      nombre: n, rango: rango.trim() || null, created_by: session.id,
    } as any);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "CREATE_PD_MEMBER", { nombre: n, rango });
    setNombre(""); setRango("");
    toast.success(`${n} añadido a la Lista PD`);
    load();
  }

  async function save(id: string, patch: Partial<PdMember>) {
    const { error } = await supabase.from("pd_members").update(patch as any).eq("id", id);
    if (error) toast.error(error.message);
  }

  async function remove(m: PdMember) {
    if (!confirm(`¿Eliminar a ${m.nombre} de la Lista PD?`)) return;
    const { error } = await supabase.from("pd_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "DELETE_PD_MEMBER", { nombre: m.nombre });
    load();
  }

  const filtered = members.filter(m =>
    (m.nombre + " " + (m.rango ?? "")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border border-blue-200 bg-white shadow-sm rounded-none">
        <div className="h-1 bg-blue-600" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-white border border-blue-200 p-1">
              <img src={sapdLogo.url} alt="SAPD" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-blue-600 text-xs uppercase tracking-[0.3em] font-bold">
                San Andreas Police Department
              </p>
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 font-display">
                Lista PD
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-600 text-white">
              <Users className="w-4 h-4" />
              <span className="font-mono font-bold">{members.length}</span>
              <span className="text-[10px] uppercase tracking-widest">Agentes</span>
            </div>
          </div>

          <form onSubmit={addMember} className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Nombre_Apellido" value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="h-11 rounded-none border-blue-300 bg-white text-slate-800 focus:border-blue-600" />
            <Input placeholder="Rango (opcional)" value={rango}
              onChange={e => setRango(e.target.value)}
              className="h-11 rounded-none border-blue-300 bg-white text-slate-800 focus:border-blue-600" />
            <Button type="submit"
              className="h-11 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wider">
              <Plus className="w-4 h-4 mr-1" /> Añadir agente
            </Button>
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden border border-blue-200 bg-white shadow-sm rounded-none">
        <div className="p-5 space-y-4">
          <Input placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)}
            className="h-10 rounded-none border-blue-300 bg-white text-slate-800 max-w-xs" />
          <div className="border border-blue-200 overflow-x-auto">
            <table className="w-full text-sm font-table">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Nombre</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Rango</th>
                  <th className="p-3 border border-blue-500 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-t border-slate-200 hover:bg-blue-50 transition-colors">
                    <td className="p-2 border border-slate-200">
                      <Input defaultValue={m.nombre}
                        onBlur={e => save(m.id, { nombre: e.target.value.trim() || m.nombre })}
                        className="h-9 rounded-none border-slate-200 bg-white text-slate-800 font-mono" />
                    </td>
                    <td className="p-2 border border-slate-200">
                      <Input defaultValue={m.rango ?? ""}
                        onBlur={e => save(m.id, { rango: e.target.value.trim() || null })}
                        className="h-9 rounded-none border-slate-200 bg-white text-slate-800" />
                    </td>
                    <td className="p-2 text-center border border-slate-200">
                      <Button size="icon" variant="ghost" onClick={() => remove(m)}
                        className="h-8 w-8 rounded-none hover:bg-red-100">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-slate-400 uppercase tracking-widest">
                      Sin agentes en la lista.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
