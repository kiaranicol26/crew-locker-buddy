import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Download, Trash2, Pencil, AlertTriangle, Upload, X, Send } from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import { sendRnapToDiscord } from "@/lib/discord";
import rnapTplUrl from "@/assets/rnap-nuevo.png";

type Cert = {
  id: string;
  nombre_completo: string;
  tipo_documento: string | null;
  numero_documento: string | null;
  fecha_nacimiento: string | null;
  nacionalidad: string | null;
  emitido_por: string | null;
  emitido_fecha: string | null;
  antecedentes: string | null;
  foto: string | null;
};

const EMPTY: Omit<Cert, "id"> = {
  nombre_completo: "",
  tipo_documento: "DNI",
  numero_documento: "",
  fecha_nacimiento: "",
  nacionalidad: "",
  emitido_por: "",
  emitido_fecha: "",
  antecedentes: "",
  foto: "",
};

export function RnapView({ session }: { session: Session }) {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<{ open: boolean; data: Cert | (Omit<Cert, "id"> & { id?: string }) } | null>(null);
  const [preview, setPreview] = useState<Cert | null>(null);
  const canEmit = session.is_alto_mando || session.can_emit_rnap;
  const canDelete = session.is_alto_mando || session.can_delete;

  async function load() {
    const { data, error } = await supabase
      .from("rnap_certificates").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setCerts((data ?? []) as Cert[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    if (!canEmit) { toast.error("No tenés permiso para emitir RNAP"); return; }
    const today = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
    setEditor({
      open: true,
      data: { ...EMPTY, emitido_fecha: today, emitido_por: session.name },
    });
  }
  function openEdit(c: Cert) {
    if (!canEmit) { toast.error("No tenés permiso para editar RNAP"); return; }
    setEditor({ open: true, data: c });
  }

  async function save() {
    if (!editor) return;
    const d = editor.data;
    if (!d.nombre_completo.trim()) { toast.error("El nombre completo es obligatorio"); return; }
    const payload = { ...d, created_by: session.id };
    if ("id" in d && d.id) {
      const { error } = await supabase.from("rnap_certificates").update(payload).eq("id", d.id);
      if (error) return toast.error(error.message);
      await logAction(supabase, session, "UPDATE_RNAP", { name: d.nombre_completo });
      toast.success("RNAP actualizado");
    } else {
      const { error } = await supabase.from("rnap_certificates").insert(payload);
      if (error) return toast.error(error.message);
      await logAction(supabase, session, "CREATE_RNAP", { name: d.nombre_completo });
      toast.success("RNAP guardado");
    }
    setEditor(null);
    load();
  }

  async function remove(c: Cert) {
    if (!canDelete) { toast.error("No tenés permiso para borrar"); return; }
    if (!confirm(`¿Borrar RNAP de ${c.nombre_completo}?`)) return;
    const { error } = await supabase.from("rnap_certificates").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "DELETE_RNAP", { name: c.nombre_completo });
    toast.success("Borrado");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="w-full bg-white border border-blue-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white border border-blue-700">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-blue-600 text-xs uppercase tracking-[0.3em] font-bold">
              San Andreas Police Department
            </p>
            <h2 className="text-2xl font-black text-slate-900 uppercase font-display">
              R.N.A.P — Registro Nacional de Antecedentes Penales
            </h2>
            <p className="text-slate-500 text-sm">Modo de Testeo — esta sección puede contener errores.</p>
          </div>
          {canEmit && (
            <Button onClick={openCreate} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Crear RNAP
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : certs.length === 0 ? (
        <p className="text-slate-500 italic">No hay certificados guardados aún.</p>
      ) : (
        <div className="grid gap-3">
          {certs.map(c => (
            <div key={c.id}
              className="flex items-center justify-between border border-blue-200 bg-white px-4 py-3">
              <button onClick={() => setPreview(c)} className="text-left flex-1">
                <div className="font-display uppercase tracking-wide text-slate-900 text-lg">{c.nombre_completo}</div>
                <div className="text-xs text-slate-500 font-mono">
                  {c.tipo_documento}: {c.numero_documento || "—"} · {c.nacionalidad || "—"}
                </div>
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreview(c)}
                  className="rounded-none border-blue-300 bg-white text-slate-700 hover:bg-blue-50">
                  Ver
                </Button>
                {canEmit && (
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}
                    className="rounded-none border-blue-300 bg-white text-slate-700 hover:bg-blue-50">
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="outline" onClick={() => remove(c)}
                    className="rounded-none border-red-300 bg-red-50 text-red-700 hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      {editor && (
        <Dialog open={editor.open} onOpenChange={(v) => !v && setEditor(null)}>
          <DialogContent className="max-w-6xl bg-slate-900 border border-blue-900/60 text-white max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-wide text-yellow-300">
                {("id" in editor.data && editor.data.id) ? "Editar RNAP" : "Crear RNAP"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6 py-2">
              <div className="space-y-3">
                <Field label="Nombre Completo">
                  <Input value={editor.data.nombre_completo}
                    onChange={e => setEditor({ ...editor, data: { ...editor.data, nombre_completo: e.target.value } })}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="Nombre Apellido" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo Doc.">
                    <Input value={editor.data.tipo_documento ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, tipo_documento: e.target.value } })}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="DNI" />
                  </Field>
                  <Field label="Nº de Documento">
                    <Input value={editor.data.numero_documento ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, numero_documento: e.target.value } })}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="000 000 000" />
                  </Field>
                </div>
                <Field label="Fecha de Nacimiento">
                  <Input value={editor.data.fecha_nacimiento ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, fecha_nacimiento: e.target.value } })}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="Día - Mes - Año" />
                </Field>
                <Field label="Nacionalidad">
                  <Input value={editor.data.nacionalidad ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, nacionalidad: e.target.value } })}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="Nacionalidad" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Emitido el">
                    <Input value={editor.data.emitido_fecha ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, emitido_fecha: e.target.value } })}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="06 de Julio 2026" />
                  </Field>
                  <Field label="Emitido por">
                    <Input value={editor.data.emitido_por ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, emitido_por: e.target.value } })}
                      className="bg-slate-800 border-slate-700 text-white" placeholder="Nombre del emisor" />
                  </Field>
                </div>
                <Field label="Antecedentes (Nº / Texto)">
                  <Input value={editor.data.antecedentes ?? ""} onChange={e => setEditor({ ...editor, data: { ...editor.data, antecedentes: e.target.value } })}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="N° 000-000-000" />
                </Field>
                <Field label="Fotografía">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 cursor-pointer text-sm">
                      <Upload className="w-4 h-4" /> Subir imagen
                      <input type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2_000_000) { toast.error("Máx 2MB"); return; }
                          const reader = new FileReader();
                          reader.onload = () => setEditor({ ...editor, data: { ...editor.data, foto: String(reader.result) } });
                          reader.readAsDataURL(file);
                        }} />
                    </label>
                    {editor.data.foto && (
                      <div className="flex items-center gap-2">
                        <img src={editor.data.foto} alt="preview" className="w-12 h-12 object-cover rounded border border-slate-700" />
                        <button type="button" onClick={() => setEditor({ ...editor, data: { ...editor.data, foto: "" } })}
                          className="text-red-300 hover:text-red-200"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              <div>
                <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Vista Previa</div>
                <RnapCard data={editor.data as Cert} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditor(null)} className="border-slate-700">Cancelar</Button>
              <Button onClick={save} className="bg-blue-700 hover:bg-blue-600">Guardar RNAP</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview dialog */}
      {preview && (
        <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
          <DialogContent className="max-w-5xl bg-slate-900 border border-blue-900/60 text-white">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-wide text-yellow-300">
                {preview.nombre_completo}
              </DialogTitle>
            </DialogHeader>
            <RnapCard data={preview} downloadable editorName={session.name} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label className="text-blue-200 text-xs uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function RnapCard({ data, downloadable = false, editorName }: { data: Cert; downloadable?: boolean; editorName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  async function download() {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `RNAP_${(data.nombre_completo || "certificado").replace(/\s+/g, "_")}.png`;
      a.click();
    } catch (e: any) {
      toast.error("No se pudo descargar: " + e.message);
    }
  }

  async function sendDiscord() {
    if (!ref.current) return;
    setSending(true);
    try {
      const blob = await toBlob(ref.current, { cacheBust: true, pixelRatio: 2 });
      if (!blob) throw new Error("No se pudo generar la imagen");
      await sendRnapToDiscord({
        editorName: editorName || "—",
        targetName: data.nombre_completo || "—",
        imageBlob: blob,
      });
      toast.success("RNAP enviado a Discord");
    } catch (e: any) {
      toast.error(e.message ?? "Error enviando");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative w-full mx-auto select-none"
        style={{ aspectRatio: "1920 / 1153", maxWidth: "100%", fontFamily: "'Times New Roman', Times, serif", containerType: "inline-size" }}
      >
        <img src={rnapTplUrl} alt="RNAP" className="absolute inset-0 w-full h-full" draggable={false} />

        {/* Foto */}
        {data.foto && (
          <img
            src={data.foto}
            alt="foto"
            className="absolute object-cover"
            style={{ left: "9.1%", top: "47.1%", width: "17.2cqw", height: "17.2cqw" }}
          />
        )}

        {/* Nombre Completo value */}
        <ValueText left="28.9%" top="48%">{data.nombre_completo || ""}</ValueText>
        {/* Documento */}
        <ValueText left="28.9%" top="58.5%">
          {data.tipo_documento || data.numero_documento
            ? `${data.tipo_documento || ""}${data.tipo_documento && data.numero_documento ? ": " : ""}${data.numero_documento || ""}`
            : ""}
        </ValueText>
        {/* Fecha */}
        <ValueText left="28.9%" top="69%">{data.fecha_nacimiento || ""}</ValueText>
        {/* Nacionalidad */}
        <ValueText left="28.9%" top="79.5%">{data.nacionalidad || ""}</ValueText>

        {/* Antecedentes - bajo la huella */}
        {data.antecedentes && (
          <div
            className="absolute text-neutral-800 text-center"
            style={{
              right: "8%",
              top: "82%",
              width: "22%",
              fontSize: "clamp(9px, 1.3cqw, 22px)",
              fontFamily: "'Times New Roman', Times, serif",
              lineHeight: 1.15,
            }}
          >
            <div className="font-bold uppercase tracking-wider" style={{ color: "#c88a15" }}>Nº Antecedentes</div>
            <div className="italic">{data.antecedentes}</div>
          </div>
        )}

        {/* Footer emitido */}
        <div
          className="absolute italic text-neutral-700"
          style={{
            right: "3%",
            bottom: "3%",
            fontSize: "1.25cqw",
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          {(data.emitido_fecha || data.emitido_por)
            ? `Emitido el ${data.emitido_fecha || "—"} en San Andreas, Por: ${data.emitido_por || "—"}`
            : ""}
        </div>
      </div>

      {downloadable && (
        <div className="flex justify-end gap-2">
          <Button onClick={download} className="bg-blue-700 hover:bg-blue-600">
            <Download className="w-4 h-4 mr-1" /> Descargar Imagen
          </Button>
          <Button onClick={sendDiscord} disabled={sending} className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 font-semibold">
            <Send className="w-4 h-4 mr-1" /> {sending ? "Enviando..." : "Enviar a Discord"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ValueText({ left, top, children }: { left: string; top: string; children: React.ReactNode }) {
  return (
    <div
      className="absolute italic text-neutral-800"
      style={{
        left, top,
        fontSize: "clamp(10px, 1.6cqw, 28px)",
        fontStyle: "italic",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  );
}
