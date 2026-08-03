import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Session, logAction } from "@/lib/session";
import { notifyDiscord } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PasaSelector } from "./RecordsTable";

export type RecordRow = {
  id: string;
  nombre_old: string | null;
  nombre_new: string | null;
  motivo: string | null;
  rango_old: string | null;
  rango_new: string | null;
  pasa: string | null;
  discord: string | null;
  nota_final: string | null;
  instructor_asignado: string | null;
  ultima_edicion_por: string | null;
};

const FIELDS: { key: keyof RecordRow; label: string; textarea?: boolean }[] = [
  { key: "nombre_old", label: "Nombre Old" },
  { key: "nombre_new", label: "Nombre New" },
  { key: "motivo", label: "Motivo", textarea: true },
  { key: "rango_old", label: "Rango Old" },
  { key: "rango_new", label: "Rango New" },
  { key: "discord", label: "Discord" },
  { key: "nota_final", label: "Nota Final", textarea: true },
  { key: "instructor_asignado", label: "Notas Adicionales" },
];

export function EditRecordDialog({
  open, onOpenChange, row, session, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: RecordRow | null;
  session: Session;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<RecordRow | null>(row);

  useEffect(() => { setForm(row); }, [row]);

  if (!form) return null;

  async function save() {
    if (!form || !row) return;

    const changes: { field: string; from: any; to: any }[] = [];
    (["pasa", ...FIELDS.map(f => f.key)] as (keyof RecordRow)[]).forEach(k => {
      const a = row[k] ?? "";
      const b = form[k] ?? "";
      if (a !== b) changes.push({ field: String(k), from: a, to: b });
    });

    const patch: any = {
      pasa: form.pasa,
      nombre_old: form.nombre_old,
      nombre_new: form.nombre_new,
      motivo: form.motivo,
      rango_old: form.rango_old,
      rango_new: form.rango_new,
      discord: form.discord,
      nota_final: form.nota_final,
      instructor_asignado: form.instructor_asignado,
      updated_by: session.id,
      ultima_edicion_por: session.name,
    };

    const { error } = await db.from("records").update(patch).eq("id", form.id);
    if (error) return toast.error(error.message);

    await logAction(db, session, "UPDATE_RECORD", { id: form.id, changes });
    await notifyDiscord({
      policiaId: session.id,
      policiaName: session.name,
      action: "Editado",
      section: "Ex Policía",
      targetName: form.nombre_new || form.nombre_old || "(sin nombre)",
      changes,
    });

    toast.success("Cambios guardados");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-blue-200 text-slate-900 rounded-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide text-blue-700">
            Editar Ex Policía
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-center gap-3">
            <Label className="w-32 text-slate-600">Pasa</Label>
            <PasaSelector value={form.pasa} onChange={v => setForm({ ...form, pasa: v })} />
          </div>

          {FIELDS.map(f => (
            <div key={String(f.key)} className="grid gap-1">
              <Label className="text-slate-600 text-xs uppercase tracking-wider">{f.label}</Label>
              {f.textarea ? (
                <Textarea
                  value={(form[f.key] as string) ?? ""}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="rounded-none border-blue-300 bg-white text-slate-800 min-h-[70px]"
                />
              ) : (
                <Input
                  value={(form[f.key] as string) ?? ""}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="rounded-none border-blue-300 bg-white text-slate-800"
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-none border-blue-300">Cancelar</Button>
          <Button onClick={save} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
