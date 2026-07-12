import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { notifyDiscord } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PasaSelector } from "./RecordsTable";

export type AspiranteRow = {
  id: string;
  pasa: string | null;
  nombre: string | null;
  dp: string | null;
  instructor: string | null;
  puntuacion_seleccion: number | null;
  puntuacion_final: number | null;
  notas: string | null;
  ultima_edicion_por: string | null;
};

export function EditAspiranteDialog({
  open, onOpenChange, row, session, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: AspiranteRow | null;
  session: Session;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AspiranteRow | null>(row);

  useEffect(() => { setForm(row); }, [row]);
  if (!form) return null;

  function setScore(key: "puntuacion_seleccion" | "puntuacion_final", raw: string) {
    if (raw === "") return setForm({ ...form!, [key]: null });
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= 0 && n <= 10) setForm({ ...form!, [key]: n });
  }

  async function save() {
    if (!form || !row) return;
    const keys: (keyof AspiranteRow)[] = ["pasa","nombre","dp","instructor","puntuacion_seleccion","puntuacion_final","notas"];
    const changes: { field: string; from: any; to: any }[] = [];
    keys.forEach(k => {
      const a = row[k] ?? "";
      const b = form[k] ?? "";
      if (a !== b) changes.push({ field: String(k), from: a, to: b });
    });

    const patch: any = {
      pasa: form.pasa,
      nombre: form.nombre,
      dp: form.dp,
      instructor: form.instructor,
      puntuacion_seleccion: form.puntuacion_seleccion,
      puntuacion_final: form.puntuacion_final,
      notas: form.notas,
      updated_by: session.id,
      ultima_edicion_por: session.name,
    };

    const { error } = await supabase.from("aspirantes").update(patch).eq("id", form.id);
    if (error) return toast.error(error.message);

    await logAction(supabase, session, "UPDATE_ASPIRANTE", { id: form.id, changes });
    await notifyDiscord({
      policiaId: session.id,
      policiaName: session.name,
      action: "Editado",
      section: "Aspirante",
      targetName: form.nombre || "(sin nombre)",
      changes,
    });

    toast.success("Cambios guardados");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border border-blue-900/60 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-wide text-yellow-400">
            Editar Aspirante
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-center gap-3">
            <Label className="w-32 text-blue-200">Pasa</Label>
            <PasaSelector value={form.pasa} onChange={v => setForm({ ...form, pasa: v })} />
          </div>

          <Field label="Nombre">
            <Input value={form.nombre ?? ""} onChange={e => setForm({ ...form, nombre: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
          </Field>
          <Field label="Discord (DP)">
            <Input value={form.dp ?? ""} onChange={e => setForm({ ...form, dp: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
          </Field>
          <Field label="Instructor">
            <Input value={form.instructor ?? ""} onChange={e => setForm({ ...form, instructor: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Punt. Selección (0-10)">
              <Input type="number" min={0} max={10} step={0.1} value={form.puntuacion_seleccion ?? ""} onChange={e => setScore("puntuacion_seleccion", e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </Field>
            <Field label="Punt. Final (0-10)">
              <Input type="number" min={0} max={10} step={0.1} value={form.puntuacion_final ?? ""} onChange={e => setScore("puntuacion_final", e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </Field>
          </div>
          <Field label="Notas adicionales">
            <Textarea value={form.notas ?? ""} onChange={e => setForm({ ...form, notas: e.target.value })} className="bg-slate-800 border-slate-700 text-white min-h-[80px]" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">Cancelar</Button>
          <Button onClick={save} className="bg-blue-700 hover:bg-blue-600">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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