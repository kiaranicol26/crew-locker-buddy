import { useEffect, useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
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
import { getBackground, setBackground, fileToCompressedDataUrl } from "@/lib/appearance";
import { toast } from "sonner";
import { Trash2, Shield, Webhook, FileText, Image as ImageIcon } from "lucide-react";


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
    <div className="space-y-4">
      {/* CREAR ID */}
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
                Crear Nuevo ID
              </h2>
            </div>
          </div>
          <form onSubmit={createInstructor} className="grid gap-3 md:grid-cols-4">
            <Input placeholder="ID (Ej: K-105WZRP)" value={newId}
              onChange={e => setNewId(e.target.value)}
              className="h-11 rounded-none border-blue-300 bg-white text-slate-800 font-mono uppercase focus:border-blue-600" />
            <Input placeholder="Nombre" value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-11 rounded-none border-blue-300 bg-white text-slate-800 focus:border-blue-600" />
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-11 rounded-none border-blue-300 bg-white text-slate-800">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-200 text-slate-800 rounded-none">
                <SelectItem value="Comisario">Comisario (Alto Mando)</SelectItem>
                <SelectItem value="Cupula">Cúpula</SelectItem>
                <SelectItem value="Instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit"
              className="h-11 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold tracking-wider">
              Crear ID
            </Button>
          </form>
        </div>
      </Card>

      {/* WEBHOOKS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden border border-blue-200 bg-white shadow-sm rounded-none">
          <div className="h-1 bg-blue-600" />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Webhook className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 font-display">
                Webhook de Cambios
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              Notificaciones de cambios en Ex Policías y Aspirantes.
            </p>
            <div className="flex gap-2">
              <Input value={webhook} onChange={e => setWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="h-11 rounded-none border-blue-300 bg-white text-slate-800 font-mono text-sm" />
              <Button onClick={saveWebhook} disabled={savingHook}
                className="h-11 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {savingHook ? "..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border border-blue-200 bg-white shadow-sm rounded-none">
          <div className="h-1 bg-blue-600" />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 font-display">
                Enviar RNAP
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              Canal al que se enviará la imagen del RNAP al presionar “Enviar a Discord”.
            </p>
            <div className="flex gap-2">
              <Input value={rnapHook} onChange={e => setRnapHook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="h-11 rounded-none border-blue-300 bg-white text-slate-800 font-mono text-sm" />
              <Button onClick={saveRnapWebhook} disabled={savingRnap}
                className="h-11 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {savingRnap ? "..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* INSTRUCTORES + PERMISOS */}
      <Card className="overflow-hidden border border-blue-200 bg-white shadow-sm rounded-none">
        <div className="h-1 bg-blue-600" />
        <div className="p-5 space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 font-display">
            Personal Autorizado
          </h2>
          <div className="border border-blue-200">
            <table className="w-full text-sm font-table">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">ID</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Nombre</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Rol</th>
                  <th className="p-3 text-center border border-blue-500 uppercase font-bold">Borrar agentes</th>
                  <th className="p-3 text-center border border-blue-500 uppercase font-bold">Emitir RNAP</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Creado por</th>
                  <th className="p-3 border border-blue-500 w-10" />
                </tr>
              </thead>
              <tbody>
                {instructors.map(i => (
                  <tr key={i.id} className="border-t border-slate-200 hover:bg-blue-50 transition-colors">
                    <td className="p-3 font-mono text-slate-700 border border-slate-200">{i.id}</td>
                    <td className="p-3 text-slate-700 border border-slate-200">{i.name}</td>
                    <td className="p-3 border border-slate-200">
                      {i.role === "Comisario" ? (
                        <span className="inline-flex items-center gap-2 text-blue-700 font-semibold">
                          <Shield className="w-4 h-4" /> Comisario
                        </span>
                      ) : (
                        <span className="text-slate-600">{i.role}</span>
                      )}
                    </td>
                    <td className="p-3 text-center border border-slate-200">
                      <Switch
                        checked={i.is_alto_mando || !!i.can_delete}
                        disabled={i.is_alto_mando}
                        onCheckedChange={v => togglePerm(i, "can_delete", v)}
                      />
                    </td>
                    <td className="p-3 text-center border border-slate-200">
                      <Switch
                        checked={i.is_alto_mando || !!i.can_emit_rnap}
                        disabled={i.is_alto_mando}
                        onCheckedChange={v => togglePerm(i, "can_emit_rnap", v)}
                      />
                    </td>
                    <td className="p-3 text-slate-500 border border-slate-200">{i.created_by ?? "—"}</td>
                    <td className="p-3 text-center border border-slate-200">
                      <Button size="icon" variant="ghost"
                        onClick={() => removeInstructor(i.id, i.name)}
                        className="h-8 w-8 rounded-none hover:bg-red-100">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {instructors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 uppercase tracking-widest">
                      Sin personal autorizado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* LOGS */}
      <Card className="border border-blue-200 bg-white shadow-sm rounded-none">
        <div className="p-5 space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 font-display">
            Registro de Movimientos
          </h2>
          <div className="border border-blue-200 max-h-[500px] overflow-auto">
            <table className="w-full text-sm font-table">
              <thead className="sticky top-0">
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Fecha</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">ID</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Nombre</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Acción</th>
                  <th className="p-3 text-left border border-blue-500 uppercase font-bold">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-t border-slate-200 hover:bg-blue-50 transition-colors">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap border border-slate-200">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-slate-700 border border-slate-200">{l.instructor_id ?? "—"}</td>
                    <td className="p-3 text-slate-700 border border-slate-200">{l.instructor_name ?? "—"}</td>
                    <td className="p-3 font-semibold text-blue-700 border border-slate-200">{l.action}</td>
                    <td className="p-3 text-xs text-slate-500 max-w-[300px] border border-slate-200">
                      {l.details ? JSON.stringify(l.details) : "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400 uppercase tracking-widest">
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
