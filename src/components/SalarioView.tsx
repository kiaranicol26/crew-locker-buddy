import { useEffect, useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronRight, Coins, Users } from "lucide-react";

type Month = {
  id: string;
  label: string;
  created_by: string | null;
  created_at: string;
};

type Entry = {
  id: string;
  month_id: string;
  nombre: string | null;
  paga: number;
  pagado: boolean;
  ultima_edicion_por: string | null;
};

type PdMember = { id: string; nombre: string; rango: string | null };

export function SalarioView({ session }: { session: Session }) {
  const [months, setMonths] = useState<Month[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pd, setPd] = useState<PdMember[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [newMonth, setNewMonth] = useState("");

  async function loadAll() {
    const [m, e, p] = await Promise.all([
      supabase.from("salary_months").select("*").order("created_at", { ascending: false }),
      supabase.from("salary_entries").select("*").order("created_at", { ascending: true }),
      supabase.from("pd_members").select("id, nombre, rango").order("nombre", { ascending: true }),
    ]);
    if (m.data) {
      setMonths(m.data as Month[]);
      setOpen(prev => {
        const next = { ...prev };
        (m.data as Month[]).forEach((x, i) => { if (next[x.id] === undefined) next[x.id] = i === 0; });
        return next;
      });
    }
    if (e.data) setEntries(e.data as Entry[]);
    if (p.data) setPd(p.data as PdMember[]);
  }

  useEffect(() => { loadAll(); }, []);

  async function syncMonth(monthId: string, existing: string[], silent = false) {
    const missing = pd.filter(p => !existing.includes(p.nombre));
    if (missing.length === 0) {
      if (!silent) toast.info("La tabla ya tiene a toda la Lista PD");
      return;
    }
    const { error } = await supabase.from("salary_entries").insert(
      missing.map(p => ({
        month_id: monthId, nombre: p.nombre, paga: 0, pagado: false,
        ultima_edicion_por: session.name,
      })) as any,
    );
    if (error) return toast.error(error.message);
    if (!silent) toast.success(`${missing.length} agentes cargados desde la Lista PD`);
    loadAll();
  }

  async function addMonth(ev: React.FormEvent) {
    ev.preventDefault();
    const label = newMonth.trim();
    if (!label) return toast.error("Escribe el nombre del mes");
    const { data, error } = await supabase
      .from("salary_months")
      .insert({ label, created_by: session.id } as any)
      .select("id")
      .maybeSingle();
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "CREATE_SALARY_MONTH", { label });
    if (data?.id) await syncMonth(data.id as string, [], true);
    setNewMonth("");
    toast.success(`Mes "${label}" creado con la Lista PD`);
    loadAll();
  }


  async function removeMonth(m: Month) {
    if (!confirm(`¿Eliminar la tabla de "${m.label}" y todos sus registros?`)) return;
    const { error } = await supabase.from("salary_months").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "DELETE_SALARY_MONTH", { label: m.label });
    loadAll();
  }

  async function addEntry(monthId: string) {
    const { error } = await supabase.from("salary_entries").insert({
      month_id: monthId, nombre: "", paga: 0, pagado: false, ultima_edicion_por: session.name,
    } as any);
    if (error) return toast.error(error.message);
    loadAll();
  }

  async function removeEntry(en: Entry) {
    if (!confirm("¿Eliminar esta fila?")) return;
    const { error } = await supabase.from("salary_entries").delete().eq("id", en.id);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "DELETE_SALARY_ENTRY", { nombre: en.nombre });
    loadAll();
  }

  function patchLocal(id: string, patch: Partial<Entry>) {
    setEntries(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function saveEntry(id: string, patch: Partial<Entry>) {
    const { error } = await supabase
      .from("salary_entries")
      .update({ ...patch, ultima_edicion_por: session.name } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
  }

  const fmt = (n: number) => `${Math.round(n).toLocaleString("es-ES")} Coins`;

  return (
    <div className="space-y-4">
      {/* CABECERA / AÑADIR MES */}
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
                Salario
              </h2>
            </div>
          </div>
          <form onSubmit={addMonth} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Nombre del mes (Ej: Enero 2026)"
              value={newMonth}
              onChange={e => setNewMonth(e.target.value)}
              className="h-11 rounded-none border-blue-300 bg-white text-slate-800 focus:border-blue-600 sm:max-w-xs"
            />
            <Button type="submit"
              className="h-11 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wider">
              <Plus className="w-4 h-4 mr-1" /> Añadir nuevo mes
            </Button>
          </form>
        </div>
      </Card>

      {months.length === 0 && (
        <Card className="border border-blue-200 bg-white rounded-none">
          <div className="p-10 text-center text-slate-400 uppercase tracking-widest">
            Sin meses creados aún.
          </div>
        </Card>
      )}

      {months.map(m => {
        const rows = entries.filter(e => e.month_id === m.id);
        const total = rows.reduce((s, r) => s + (Number(r.paga) || 0), 0);
        const pagado = rows.filter(r => r.pagado).reduce((s, r) => s + (Number(r.paga) || 0), 0);
        const isOpen = !!open[m.id];
        return (
          <Card key={m.id} className="overflow-hidden border border-blue-200 bg-white shadow-sm rounded-none">
            <div className="h-1 bg-blue-600" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-blue-200">
              <button
                onClick={() => setOpen(p => ({ ...p, [m.id]: !isOpen }))}
                className="flex items-center gap-3 text-left"
              >
                {isOpen ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-blue-600" />}
                <span className="text-xl font-black uppercase tracking-wide text-slate-900 font-display">
                  {m.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">{rows.length} agentes</span>
              </button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => syncMonth(m.id, rows.map(r => r.nombre ?? ""))}
                  className="h-9 rounded-none border-blue-300 bg-white text-blue-700 hover:bg-blue-50">
                  <Users className="w-4 h-4 mr-1" /> Cargar Lista PD
                </Button>
                <Button size="sm" onClick={() => addEntry(m.id)}
                  className="h-9 rounded-none bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Agente
                </Button>

                <Button size="icon" variant="ghost" onClick={() => removeMonth(m)}
                  className="h-9 w-9 rounded-none hover:bg-red-100">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="p-5 grid gap-4 lg:grid-cols-[1fr_auto] items-start">
                <div className="border border-blue-200 overflow-x-auto">
                  <table className="w-full text-sm font-table">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="p-3 text-left border border-blue-500 uppercase font-bold">Nombre SAPD</th>
                        <th className="p-3 text-left border border-blue-500 uppercase font-bold">Mes</th>
                        <th className="p-3 text-left border border-blue-500 uppercase font-bold">Paga total (Coins)</th>
                        <th className="p-3 text-center border border-blue-500 uppercase font-bold">Pagado</th>
                        <th className="p-3 border border-blue-500 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.id} className="border-t border-slate-200 hover:bg-blue-50 transition-colors">
                          <td className="p-2 border border-slate-200">
                            <Input
                              list="pd-members-list"
                              value={r.nombre ?? ""}
                              onChange={e => patchLocal(r.id, { nombre: e.target.value })}
                              onBlur={e => saveEntry(r.id, { nombre: e.target.value })}
                              placeholder="Nombre_Apellido"
                              className="h-9 rounded-none border-slate-200 bg-white text-slate-800 font-mono"
                            />
                          </td>

                          <td className="p-3 border border-slate-200 text-slate-600 whitespace-nowrap">{m.label}</td>
                          <td className="p-2 border border-slate-200">
                            <Input
                              type="number"
                              value={String(r.paga ?? 0)}
                              onChange={e => patchLocal(r.id, { paga: Number(e.target.value) })}
                              onBlur={e => saveEntry(r.id, { paga: Number(e.target.value) || 0 })}
                              className="h-9 rounded-none border-slate-200 bg-white text-slate-800 font-mono"
                            />
                          </td>
                          <td className="p-3 text-center border border-slate-200">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={r.pagado}
                                onCheckedChange={v => { patchLocal(r.id, { pagado: v }); saveEntry(r.id, { pagado: v }); }}
                              />
                              <span className={`text-xs font-bold ${r.pagado ? "text-emerald-600" : "text-red-600"}`}>
                                {r.pagado ? "SÍ" : "NO"}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center border border-slate-200">
                            <Button size="icon" variant="ghost" onClick={() => removeEntry(r)}
                              className="h-8 w-8 rounded-none hover:bg-red-100">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 uppercase tracking-widest">
                            Sin agentes en este mes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TOTAL DEL MES */}
                <div className="border border-blue-200 bg-blue-50 min-w-[220px]">
                  <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <span className="uppercase font-bold tracking-wider text-xs">Total del Mes</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total</p>
                      <p className="text-2xl font-black text-slate-900 font-mono">{fmt(total)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Pagado</p>
                      <p className="text-lg font-bold text-emerald-600 font-mono">{fmt(pagado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Pendiente</p>
                      <p className="text-lg font-bold text-red-600 font-mono">{fmt(total - pagado)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
