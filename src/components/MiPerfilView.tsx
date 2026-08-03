import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { setSession, logAction, type Session } from "@/lib/session";
import { fileToCompressedDataUrl } from "@/lib/appearance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload, UserRound } from "lucide-react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";

export function MiPerfilView({ session }: { session: Session }) {
  const [name, setName] = useState(session.name);
  const [descripcion, setDescripcion] = useState(session.descripcion ?? "");
  const [avatar, setAvatar] = useState(session.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db
      .from("instructors")
      .select("name, avatar_url, descripcion")
      .eq("id", session.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setName(data.name ?? "");
        setAvatar((data as any).avatar_url ?? "");
        setDescripcion((data as any).descripcion ?? "");
      });
  }, [session.id]);

  async function handleUpload(file: File) {
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 512);
      setAvatar(dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen");
    }
  }

  async function save() {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    const { error } = await db
      .from("instructors")
      .update({ name: name.trim(), avatar_url: avatar.trim() || null, descripcion: descripcion.trim() || null } as any)
      .eq("id", session.id);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar");
      return;
    }
    setSession({ ...session, name: name.trim(), avatar_url: avatar.trim() || null, descripcion: descripcion.trim() || null });
    await logAction(db, session, "PERFIL_ACTUALIZADO", { id: session.id });
    toast.success("Perfil actualizado");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="rounded-none border-2 border-blue-300 bg-white">
        <div className="bg-blue-600 px-4 py-2 flex items-center gap-2">
          <img src={sapdLogo.url} alt="SAPD" className="w-6 h-6 object-contain" />
          <h2 className="text-white font-display font-extrabold uppercase tracking-widest text-sm">myPerfil</h2>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-40 h-40 border-2 border-blue-300 bg-slate-50 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserRound className="w-16 h-16 text-blue-300" />
            )}
          </div>
          <p className="text-xs font-mono text-slate-500">{session.id}</p>
          <label className="w-full">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <span className="flex h-10 w-full items-center justify-center gap-2 border border-blue-300 bg-white text-blue-800 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:bg-blue-50">
              <Upload className="w-4 h-4" /> Subir foto
            </span>
          </label>
        </div>
      </Card>

      <Card className="rounded-none border-2 border-blue-300 bg-white">
        <div className="bg-blue-600 px-4 py-2">
          <h2 className="text-white font-display font-extrabold uppercase tracking-widest text-sm">Datos del perfil</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Nombre</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 h-10 rounded-none border-blue-300 bg-white font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Foto de perfil (enlace)</label>
            <Input
              value={avatar.startsWith("data:") ? "" : avatar}
              placeholder={avatar.startsWith("data:") ? "Imagen subida desde tu dispositivo" : "https://..."}
              onChange={e => setAvatar(e.target.value)}
              className="mt-1 h-10 rounded-none border-blue-300 bg-white font-semibold text-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Descripción</label>
            <Textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Escribe algo sobre ti..."
              className="mt-1 min-h-28 rounded-none border-blue-300 bg-white font-semibold text-slate-800"
            />
          </div>
          <Button onClick={save} disabled={saving}
            className="h-11 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase tracking-widest">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
