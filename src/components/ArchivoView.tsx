import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/db";
import { logAction, type Session } from "@/lib/session";
import { sendArchivoToDiscord } from "@/lib/discord";
import { normName as norm } from "@/lib/archivo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Send, UserRound, Search, ShieldCheck } from "lucide-react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";

type Persona = {
  id: string;
  nombre: string;
  foto: string | null;
  es_policia: boolean;
  game_id: string | null;
  veto_sapd: boolean;
  veto_edsa: boolean;
  veto_staff: boolean;
  cap_m4: boolean;
  cap_edc: boolean;
  cap_mary: boolean;
  created_by: string | null;
};

type Nota = {
  id: string;
  persona_id: string;
  autor: string | null;
  texto: string;
  created_at: string;
};

type Rnap = { nombre_completo: string; foto: string | null };
type Usuario = {
  id: string;
  name: string;
  avatar_url: string | null;
  descripcion: string | null;
  role: string | null;
  is_alto_mando: boolean;
};

type Item = {
  key: string;
  nombre: string;
  foto: string | null;
  descripcion: string | null;
  isUser: boolean;
  rol: string | null;
  persona: Persona | null;
};

const ROL_LABEL: Record<string, string> = {
  Comisario: "Comisario (Alto Mando)",
  Cupula: "Cúpula Administrativa",
  Instructor: "Instructor",
};

const rolLabel = (rol?: string | null) => (rol ? (ROL_LABEL[rol] ?? rol) : "Usuario");

const randomGameId = () => String(Math.floor(100 + Math.random() * 900));

function Toggle({
  value,
  onChange,
  disabled,
  disabledLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest border-2 transition-colors ${
        disabled
          ? "border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed"
          : value
            ? "border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
            : "border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
      }`}
    >
      {disabled ? (disabledLabel ?? "No editable") : value ? "SÍ" : "NO"}
    </button>
  );
}

export function ArchivoView({ session }: { session: Session }) {
  const canEdit = !!session.is_alto_mando || !!session.can_edit_files;
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [rnaps, setRnaps] = useState<Rnap[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [newNota, setNewNota] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const [p, n, r, u] = await Promise.all([
      db.from("archivo_personas").select("*").order("nombre", { ascending: true }),
      db.from("archivo_notas").select("*").order("created_at", { ascending: true }),
      db.from("rnap_certificates").select("nombre_completo, foto"),
      db.from("instructors").select("id,name,avatar_url,descripcion,role,is_alto_mando"),
    ]);
    if (p.data) setPersonas(p.data as Persona[]);
    if (n.data) setNotas(n.data as Nota[]);
    if (r.data) setRnaps(r.data as Rnap[]);
    if (u.data) setUsuarios(u.data as Usuario[]);
  }

  useEffect(() => { load(); }, []);

  const rnapFotoDe = (nombre: string) =>
    rnaps.find(r => norm(r.nombre_completo) === norm(nombre))?.foto ?? null;

  const items = useMemo<Item[]>(() => {
    const userItems: Item[] = usuarios.map(u => {
      const persona = personas.find(p => norm(p.nombre) === norm(u.name)) ?? null;
      return {
        key: `user:${u.id}`,
        nombre: u.name,
        foto: u.avatar_url ?? persona?.foto ?? rnapFotoDe(u.name),
        descripcion: u.descripcion ?? null,
        isUser: true,
        rol: u.is_alto_mando ? "Comisario" : (u.role ?? null),
        persona,
      };
    });
    const userNames = new Set(usuarios.map(u => norm(u.name)));
    const archived: Item[] = personas
      .filter(p => !userNames.has(norm(p.nombre)))
      .map(p => ({
        key: `persona:${p.id}`,
        nombre: p.nombre,
        foto: rnapFotoDe(p.nombre) ?? p.foto,
        descripcion: null,
        isUser: false,
        rol: null,
        persona: p,
      }));
    return [...userItems, ...archived];
  }, [usuarios, personas, rnaps]);

  const open = items.find(i => i.key === openKey) ?? null;
  const openPersona = open?.persona ?? null;
  const openNotas = useMemo(
    () => (openPersona ? notas.filter(n => n.persona_id === openPersona.id) : []),
    [notas, openPersona],
  );
  const rnapFoto = open ? rnapFotoDe(open.nombre) : null;

  const filtered = useMemo(() => {
    const t = norm(q);
    if (!t) return items;
    return items.filter(
      i => norm(i.nombre).includes(t) || (i.persona?.game_id ?? "").includes(q.trim()),
    );
  }, [items, q]);

  // Los usuarios con login necesitan una ficha para guardar datos: se crea al abrirla.
  async function openItem(item: Item) {
    setOpenKey(item.key);
    if (item.persona || !item.isUser || !canEdit) return;
    const { error } = await db.from("archivo_personas").insert({ nombre: item.nombre, created_by: session.id });
    if (!error) await load();
  }

  async function patch(values: Partial<Persona>) {
    if (!openPersona) return toast.error("Sin ficha editable todavía");
    const id = openPersona.id;
    setPersonas(prev => prev.map(p => (p.id === id ? { ...p, ...values } : p)));
    const { error } = await db.from("archivo_personas").update(values as any).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  }

  async function removePersona() {
    if (!openPersona) return;
    if (!confirm(`¿Eliminar el archivo de ${openPersona.nombre}?`)) return;
    const { error } = await db.from("archivo_personas").delete().eq("id", openPersona.id);
    if (error) return toast.error(error.message);
    await logAction(db, session, "DELETE_ARCHIVO", { nombre: openPersona.nombre });
    setOpenKey(null);
    load();
  }

  async function addNota() {
    if (!openPersona || !newNota.trim()) return;
    const { error } = await db.from("archivo_notas").insert({
      persona_id: openPersona.id, autor: session.name, texto: newNota.trim(),
    });
    if (error) return toast.error(error.message);
    setNewNota("");
    load();
  }

  async function removeNota(id: string) {
    const { error } = await db.from("archivo_notas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function sendDiscord() {
    if (!open) return;
    setSending(true);
    try {
      await sendArchivoToDiscord({
        editorName: session.name,
        nombre: open.nombre,
        esPolicia: openPersona?.es_policia ?? open.isUser,
        gameId: openPersona?.game_id ?? null,
        foto: open.foto ?? rnapFoto,
        vetos: {
          sapd: openPersona?.veto_sapd ?? false,
          edsa: openPersona?.veto_edsa ?? false,
          staff: openPersona?.veto_staff ?? false,
        },
        capacitaciones: {
          m4: openPersona?.cap_m4 ?? false,
          edc: openPersona?.cap_edc ?? false,
          mary: openPersona?.cap_mary ?? false,
        },
        notas: openNotas.map(n => ({ autor: n.autor, texto: n.texto })),
      });
      await logAction(db, session, "SEND_ARCHIVO_DISCORD", { nombre: open.nombre });
      toast.success("Enviado a Discord");
    } catch (e: any) { toast.error(e.message ?? "Error al enviar"); }
    finally { setSending(false); }
  }

  const esPolicia = openPersona?.es_policia ?? false;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2 border-blue-300 bg-white shadow-md rounded-none">
        <div className="h-1.5 bg-blue-700" />
        <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-white border border-blue-200 p-1">
              <img src={sapdLogo.url} alt="SAPD" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-blue-600 text-xs uppercase tracking-[0.3em] font-bold">
                San Andreas Police Department
              </p>
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 font-display">
                Archivo de Personas
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre o #ID"
                className="h-11 pl-8 rounded-none border-blue-300 bg-white text-slate-800 w-64" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-4 -mt-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Los agentes con usuario aparecen anclados arriba. Las demás fichas se crean automáticamente
            al emitir un Antecedente (R.N.A.P).
          </p>
        </div>
      </Card>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map(item => (
          <button key={item.key} type="button" onClick={() => openItem(item)}
            className={`group border-2 bg-white transition-colors text-left ${
              item.isUser ? "border-blue-600 shadow-md" : "border-blue-200 hover:border-blue-600"
            }`}>
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
              {item.foto ? (
                <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-12 h-12 text-slate-300" />
              )}
              {item.isUser && (
                <span className="absolute top-0 left-0 bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {item.persona?.es_policia ? rolLabel(item.rol) : "Usuario"}
                </span>
              )}
            </div>
            <div className="p-2 border-t-2 border-blue-200">
              <p className="font-black uppercase text-xs tracking-wider text-slate-800 truncate">{item.nombre}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                {item.isUser
                  ? item.descripcion || "Agente con usuario"
                  : `${item.persona?.es_policia ? "Policía" : "Archivado"}${item.persona?.game_id ? ` · #${item.persona.game_id}` : ""}`}
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-500 uppercase tracking-widest font-bold bg-white border-2 border-blue-200">
            Sin registros en el archivo.
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={o => !o && setOpenKey(null)}>
        <DialogContent className="max-w-3xl rounded-none border-2 border-blue-300 bg-white max-h-[90vh] overflow-auto">
          {open && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 border-b-2 border-blue-200 pb-3">
                <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 font-display">
                  Ficha de {open.nombre}
                </h3>
                {canEdit && !open.isUser && openPersona && (
                  <Button variant="ghost" onClick={removePersona}
                    className="rounded-none hover:bg-red-100">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                <div className="space-y-2">
                  <div className="aspect-square border-2 border-blue-300 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {open.foto ? (
                      <img src={open.foto} alt={open.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                    {open.isUser ? "Foto de myPerfil" : "Foto del R.N.A.P"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Nombre</p>
                    <Input value={open.nombre} readOnly
                      className="h-10 rounded-none border-blue-300 font-bold" />
                  </div>

                  {open.isUser && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">Descripción</p>
                      <p className="text-sm font-semibold text-slate-700 bg-blue-50/60 border border-blue-200 p-2">
                        {open.descripcion || "Sin descripción en myPerfil."}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Es Policía</p>
                    <Toggle value={esPolicia} disabled={!canEdit || !openPersona}
                      onChange={v => patch({ es_policia: v })} />
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">R.N.A.P</p>
                    {rnapFoto ? (
                      <img src={rnapFoto} alt="RNAP" className="max-h-48 border-2 border-blue-300" />
                    ) : (
                      <p className="text-xs font-bold text-slate-400">Sin certificado R.N.A.P para este nombre.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Corresponde a Vetos
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {([["SAPD", "veto_sapd"], ["EDSA", "veto_edsa"], ["STAFF", "veto_staff"]] as const).map(([label, key]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-slate-700">{label}</span>
                          <Toggle value={openPersona?.[key] ?? false} disabled={!canEdit || !openPersona}
                            onChange={v => patch({ [key]: v } as Partial<Persona>)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">#ID</p>
                    <Input value={openPersona?.game_id ?? ""} readOnly
                      className="h-10 rounded-none border-blue-300 font-mono w-40" />
                    <p className="text-[11px] font-bold text-slate-400 mt-1">
                      -# Asignado automáticamente por la web
                    </p>
                  </div>


                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Capacitaciones
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {([["M4", "cap_m4"], ["EDC", "cap_edc"], ["MARY", "cap_mary"]] as const).map(([label, key]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-slate-700">{label}</span>
                          <Toggle value={openPersona?.[key] ?? false}
                            disabled={!canEdit || !openPersona || !esPolicia}
                            disabledLabel={!esPolicia ? "No es policía" : "No editable"}
                            onChange={v => patch({ [key]: v } as Partial<Persona>)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-blue-200 pt-4 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Notas</p>
                <div className="space-y-2">
                  {openNotas.map(n => (
                    <div key={n.id} className="flex items-start justify-between gap-2 bg-blue-50/60 border border-blue-200 p-2">
                      <p className="text-sm text-slate-700 font-semibold">
                        <span className="text-blue-700">Nota de {n.autor ?? "—"}:</span> {n.texto}
                      </p>
                      {canEdit && (
                        <button type="button" onClick={() => removeNota(n.id)}
                          className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {openNotas.length === 0 && (
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin notas.</p>
                  )}
                </div>
                {canEdit && openPersona && (
                  <div className="flex gap-2">
                    <Textarea value={newNota} onChange={e => setNewNota(e.target.value)}
                      placeholder="Escribe una nota…"
                      className="rounded-none border-blue-300 min-h-[44px]" />
                    <Button onClick={addNota} className="rounded-none bg-blue-700 hover:bg-blue-800 text-white font-bold">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t-2 border-blue-200 pt-4">
                <Button onClick={sendDiscord} disabled={sending}
                  className="rounded-none bg-blue-700 hover:bg-blue-800 text-white font-bold">
                  <Send className="w-4 h-4 mr-2" /> {sending ? "Enviando…" : "Enviar a Discord"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
