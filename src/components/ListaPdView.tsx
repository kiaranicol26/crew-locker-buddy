import { useEffect, useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
import { db } from "@/lib/db";
import { Session, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RANGOS, sortByRango } from "@/lib/rangos";
import { toast } from "sonner";
import { Trash2, Plus, Users } from "lucide-react";

export type PdMember = {
  id: string;
  nombre: string;
  rango: string | null;
  sueldo_defecto: number;
  es_instructor: boolean;
  created_at: string;
};

export function ListaPdView({ session }: { session: Session }) {
  const [members, setMembers] = useState<PdMember[]>([]);
  const [nombre, setNombre] = useState("");
  const [rango, setRango] = useState<string>("Oficial");
  const [q, setQ] = useState("");
  const alto = session.is_alto_mando;

  async function load() {
    const { data } = await db
      .from("pd_members")
      .select("*")
      .order("nombre", { ascending: true });
    if (data) setMembers(data as unknown as PdMember[]);
  }

  useEffect(() => { load(); }, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) return toast.error("Escribe el Nombre_Apellido");
    const { error } = await db.from("pd_members").insert({
      nombre: n, rango: rango || null, created_by: session.id,
    } as any);
    if (error) return toast.error(error.message);
    await logAction(db, session, "CREATE_PD_MEMBER", { nombre: n, rango });
    setNombre("");
    toast.success(`${n} añadido a la Lista PD`);
    load();
  }

  async function save(id: string, patch: Partial<PdMember>) {
    setMembers(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await db.from("pd_members").update(patch as any).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  }

  async function remove(m: PdMember) {
    if (!confirm(`¿Eliminar a ${m.nombre} de la Lista PD?`)) return;
    const { error } = await db.from("pd_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAction(db, session, "DELETE_PD_MEMBER", { nombre: m.nombre });
    load();
  }

  const filtered = sortByRango(
    members.filter(m =>
      (m.nombre + " " + (m.rango ?? "")).toLowerCase().includes(q.toLowerCase()),
    ),
    m => m.rango,
    m => m.nombre,
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2 border-blue-300 bg-white shadow-md rounded-none">
        <div className="h-1.5 bg-blue-700" />
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-white border-2 border-blue-300 p-1">
              <img src={sapdLogo.url} alt="SAPD" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-blue-700 text-xs uppercase tracking-[0.3em] font-extrabold">
                San Andreas Police Department
              </p>
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 font-display">
                Lista PD
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-700 text-white">
              <Users className="w-4 h-4" />
              <span className="font-mono font-bold">{members.length}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Agentes</span>
            </div>
          </div>

          <form onSubmit={addMember} className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Nombre_Apellido" value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="h-11 rounded-none border-blue-300 bg-white font-semibold text-slate-800 focus:border-blue-700" />
            <Select value={rango} onValueChange={setRango}>
              <SelectTrigger className="h-11 rounded-none border-blue-300 bg-white font-semibold text-slate-800">
                <SelectValue placeholder="Rango" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-200 rounded-none">
                {RANGOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit"
              className="h-11 rounded-none bg-blue-700 hover:bg-blue-800 text-white font-bold tracking-wider">
              <Plus className="w-4 h-4 mr-1" /> Añadir agente
            </Button>
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden border-2 border-blue-300 bg-white shadow-md rounded-none">
        <div className="p-5 space-y-4">
          <Input placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)}
            className="h-10 rounded-none border-blue-300 bg-white font-semibold text-slate-800 max-w-xs" />
          <div className="border-2 border-blue-300 overflow-x-auto">
            <table className="w-full text-sm font-table">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-3 text-left border border-blue-600 uppercase font-extrabold tracking-wider">Nombre</th>
                  <th className="p-3 text-left border border-blue-600 uppercase font-extrabold tracking-wider">Rango</th>
                  <th className="p-3 text-left border border-blue-600 uppercase font-extrabold tracking-wider">Sueldo por defecto</th>
                  <th className="p-3 text-center border border-blue-600 uppercase font-extrabold tracking-wider">Instructor</th>
                  <th className="p-3 border border-blue-600 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr key={m.id}
                    className={`border-t border-blue-200 hover:bg-blue-100 transition-colors ${idx % 2 ? "bg-slate-50" : "bg-blue-50/40"}`}>
                    <td className="p-2 border border-blue-200">
                      <Input defaultValue={m.nombre}
                        onBlur={e => save(m.id, { nombre: e.target.value.trim() || m.nombre })}
                        className="h-9 rounded-none border-blue-200 bg-white text-slate-800 font-mono font-bold" />
                    </td>
                    <td className="p-2 border border-blue-200">
                      <Select value={m.rango ?? ""} onValueChange={v => save(m.id, { rango: v })}>
                        <SelectTrigger className="h-9 rounded-none border-blue-200 bg-white font-bold text-slate-800">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-blue-200 rounded-none">
                          {RANGOS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border border-blue-200">
                      <Input type="number" value={String(m.sueldo_defecto ?? 0)}
                        disabled={!alto}
                        onChange={e => setMembers(prev => prev.map(x => x.id === m.id ? { ...x, sueldo_defecto: Number(e.target.value) } : x))}
                        onBlur={e => save(m.id, { sueldo_defecto: Number(e.target.value) || 0 })}
                        className="h-9 rounded-none border-blue-200 bg-white text-slate-800 font-mono font-bold disabled:opacity-70" />
                    </td>
                    <td className="p-3 text-center border border-blue-200">
                      <div className="flex items-center justify-center gap-2">
                        <Switch checked={!!m.es_instructor}
                          onCheckedChange={v => save(m.id, { es_instructor: v })} />
                        <span className={`text-xs font-extrabold ${m.es_instructor ? "text-emerald-700" : "text-slate-400"}`}>
                          {m.es_instructor ? "SÍ" : "NO"}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center border border-blue-200">
                      <Button size="icon" variant="ghost" onClick={() => remove(m)}
                        className="h-8 w-8 rounded-none hover:bg-red-100">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 uppercase tracking-widest font-bold">
                      Sin agentes en la lista.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!alto && (
            <p className="text-xs text-slate-500 font-semibold">
              El “Sueldo por defecto” solo puede definirlo un Alto Mando.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
