import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getWebhookUrl, setWebhookUrl,
  getRnapWebhookUrl, setRnapWebhookUrl,
} from "@/lib/discord";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Shield, Webhook, FileText } from "lucide-react";

type Instructor = {
  id: string;
  name: string;
  is_alto_mando: boolean;
  role: string;
  can_delete: boolean;
  can_emit_rnap: boolean;
  created_at: string;
  created_by: string | null;
};

type Log = {
  id: string;
  instructor_id: string | null;
  instructor_name: string | null;
  action: string;
  details: any;
  created_at: string;
};

export function AltoMando({ session }: { session: Session }) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Instructor");

  const [webhook, setWebhook] = useState("");
  const [savingHook, setSavingHook] = useState(false);
  const [rnapHook, setRnapHook] = useState("");
  const [savingRnap, setSavingRnap] = useState(false);

  async function loadAll() {
    const [i, l] = await Promise.all([
      supabase.from("instructors").select("*").order("created_at", { ascending: true }),
      supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (i.data) setInstructors(i.data as Instructor[]);
    if (l.data) setLogs(l.data as Log[]);
  }

  useEffect(() => {
    loadAll();
    getWebhookUrl(true).then(setWebhook);
    getRnapWebhookUrl(true).then(setRnapHook);
  }, []);

  async function saveWebhook() {
    setSavingHook(true);
    try {
      await setWebhookUrl(webhook);
      await logAction(supabase, session, "UPDATE_WEBHOOK", { url: webhook ? "(set)" : "(cleared)" });
      toast.success("Webhook guardado");
    } catch (e: any) { toast.error(e.message ?? "Error"); }
    finally { setSavingHook(false); }
  }

  async function saveRnapWebhook() {
    setSavingRnap(true);
    try {
      await setRnapWebhookUrl(rnapHook);
      await logAction(supabase, session, "UPDATE_RNAP_WEBHOOK", { url: rnapHook ? "(set)" : "(cleared)" });
      toast.success("Webhook de RNAP guardado");
    } catch (e: any) { toast.error(e.message ?? "Error"); }
    finally { setSavingRnap(false); }
  }

  async function createInstructor(e: React.FormEvent) {
    e.preventDefault();
    const id = newId.trim().toUpperCase();
    const name = newName.trim();
    if (!id || !name) return toast.error("ID y nombre requeridos");
    const isAlto = newRole === "Comisario";
    const { error } = await supabase.from("instructors").insert({
      id, name,
      is_alto_mando: isAlto,
      role: newRole,
      can_delete: isAlto,
      can_emit_rnap: isAlto,
      created_by: session.id,
    } as any);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "CREATE_ID", { id, name, role: newRole });
    toast.success(`ID ${id} (${name}) creado como ${newRole}`);
    setNewId(""); setNewName(""); setNewRole("Instructor");
    loadAll();
  }

  async function removeInstructor(id: string, name: string) {
    if (id === session.id) return toast.error("No puedes eliminarte a ti mismo");
    if (!confirm(`¿Eliminar ID ${id} (${name})?`)) return;
    const { error } = await supabase.from("instructors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "DELETE_ID", { id, name });
    loadAll();
  }

  async function togglePerm(i: Instructor, field: "can_delete" | "can_emit_rnap", value: boolean) {
    if (i.is_alto_mando) { toast.info("Los Comisarios tienen todos los permisos"); return; }
    setInstructors(prev => prev.map(x => x.id === i.id ? { ...x, [field]: value } : x));
    const { error } = await supabase.from("instructors").update({ [field]: value } as any).eq("id", i.id);
    if (error) { toast.error(error.message); loadAll(); return; }
    await logAction(supabase, session, "UPDATE_PERM", { id: i.id, name: i.name, field, value });
  }

  return (
    <div className="space-y-6">
      {/* CREAR ID */}
      <Card className="overflow-hidden border border-slate-700/60 bg-slate-900/85 backdrop-blur shadow-[0_0_45px_rgba(0,0,0,.55)]">
        <div className="h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" />
        <div className="p-6 space-y-5">
          <div>
            <p className="text-blue-300 text-xs uppercase tracking-[0.35em] font-semibold">
              San Andreas Police Department
            </p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase tracking-wide text-white font-display">
              Crear Nuevo ID
            </h2>
          </div>
          <form onSubmit={createInstructor} className="grid gap-3 md:grid-cols-4">
            <Input placeholder="ID (Ej: R-105WZRP)" value={newId}
              onChange={e => setNewId(e.target.value)}
              className="h-11 bg-slate-800 border-slate-700 text-white font-mono uppercase focus:border-blue-500" />
            <Input placeholder="Nombre" value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-11 bg-slate-800 border-slate-700 text-white focus:border-blue-500" />
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-11 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="Comisario">Comisario (Alto Mando)</SelectItem>
                <SelectItem value="Cupula">Cúpula</SelectItem>
                <SelectItem value="Instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit"
              className="h-11 bg-blue-700 hover:bg-blue-600 text-white font-semibold tracking-wider shadow-lg shadow-blue-900/40">
              Crear ID
            </Button>
          </form>
        </div>
      </Card>

      {/* WEBHOOKS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden border border-slate-700/60 bg-slate-900/85 backdrop-blur shadow-[0_0_45px_rgba(0,0,0,.55)]">
          <div className="h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Webhook className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-white font-display">
                Webhook de Cambios
              </h2>
            </div>
            <p className="text-slate-400 text-sm">
              Notificaciones de cambios en Ex Policías y Aspirantes.
            </p>
            <div className="flex gap-2">
              <Input value={webhook} onChange={e => setWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="h-11 bg-slate-800 border-slate-700 text-white font-mono text-sm" />
              <Button onClick={saveWebhook} disabled={savingHook}
                className="h-11 bg-blue-800 hover:bg-blue-700 text-white font-semibold">
                {savingHook ? "..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border border-slate-700/60 bg-slate-900/85 backdrop-blur shadow-[0_0_45px_rgba(0,0,0,.55)]">
          <div className="h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-white font-display">
                Enviar RNAP
              </h2>
            </div>
            <p className="text-slate-400 text-sm">
              Canal al que se enviará la imagen del RNAP al presionar “Enviar a Discord”.
            </p>
            <div className="flex gap-2">
              <Input value={rnapHook} onChange={e => setRnapHook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="h-11 bg-slate-800 border-slate-700 text-white font-mono text-sm" />
              <Button onClick={saveRnapWebhook} disabled={savingRnap}
                className="h-11 bg-blue-800 hover:bg-blue-700 text-white font-semibold">
                {savingRnap ? "..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* INSTRUCTORES + PERMISOS */}
      <Card className="overflow-hidden border border-slate-700/60 bg-slate-900/85 backdrop-blur shadow-[0_0_45px_rgba(0,0,0,.55)]">
        <div className="h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" />
        <div className="p-6 space-y-5">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white font-display">
            Personal Autorizado
          </h2>
          <div className="border border-slate-700/50 rounded-md overflow-auto">
            <table className="w-full text-sm font-table">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 via-slate-700/80 to-slate-800">
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">ID</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Nombre</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Rol</th>
                  <th className="p-3 text-center text-blue-200 border border-slate-700/50">Borrar agentes</th>
                  <th className="p-3 text-center text-blue-200 border border-slate-700/50">Emitir RNAP</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Creado por</th>
                  <th className="p-3 border border-slate-700/50 w-10" />
                </tr>
              </thead>
              <tbody>
                {instructors.map(i => (
                  <tr key={i.id} className="border-t border-slate-700/40 hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-blue-200">{i.id}</td>
                    <td className="p-3 text-white">{i.name}</td>
                    <td className="p-3">
                      {i.role === "Comisario" ? (
                        <span className="inline-flex items-center gap-2 text-yellow-400 font-semibold">
                          <Shield className="w-4 h-4" /> Comisario
                        </span>
                      ) : (
                        <span className="text-slate-300">{i.role}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Switch
                        checked={i.is_alto_mando || !!i.can_delete}
                        disabled={i.is_alto_mando}
                        onCheckedChange={v => togglePerm(i, "can_delete", v)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Switch
                        checked={i.is_alto_mando || !!i.can_emit_rnap}
                        disabled={i.is_alto_mando}
                        onCheckedChange={v => togglePerm(i, "can_emit_rnap", v)}
                      />
                    </td>
                    <td className="p-3 text-slate-400">{i.created_by ?? "—"}</td>
                    <td className="p-3 text-center">
                      <Button size="icon" variant="ghost"
                        onClick={() => removeInstructor(i.id, i.name)}
                        className="h-8 w-8 hover:bg-red-900/30">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* LOGS */}
      <Card className="border border-slate-700/60 bg-slate-900/85 backdrop-blur shadow-[0_0_45px_rgba(0,0,0,.55)]">
        <div className="p-6 space-y-5">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white font-display">
            Registro de Movimientos
          </h2>
          <div className="border border-slate-700/50 rounded-md overflow-auto max-h-[500px]">
            <table className="w-full text-sm font-table">
              <thead className="sticky top-0">
                <tr className="bg-gradient-to-r from-slate-800 via-slate-700/80 to-slate-800">
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Fecha</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">ID</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Nombre</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Acción</th>
                  <th className="p-3 text-left text-blue-200 border border-slate-700/50">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-t border-slate-700/40 hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-blue-200">{l.instructor_id ?? "—"}</td>
                    <td className="p-3 text-white">{l.instructor_name ?? "—"}</td>
                    <td className="p-3 font-semibold text-yellow-400">{l.action}</td>
                    <td className="p-3 text-xs text-slate-400 max-w-[300px]">
                      {l.details ? JSON.stringify(l.details) : "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Sin movimientos aún.
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