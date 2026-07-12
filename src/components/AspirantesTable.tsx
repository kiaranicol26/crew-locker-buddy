import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { notifyDiscord } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Download, FileImage, Eraser, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { PasaSelector } from "./RecordsTable";
import { EditAspiranteDialog, type AspiranteRow } from "./EditAspiranteDialog";

export function AspirantesTable({ session }: { session: Session }) {
  const [rows, setRows] = useState<AspiranteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AspiranteRow | null>(null);
  const isComisario = session.is_alto_mando;
  const canDelete = session.is_alto_mando || session.can_delete;

  async function load() {
    const { data, error } = await supabase
      .from("aspirantes").select("*").order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as AspiranteRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addRow() {
    const { data, error } = await supabase
      .from("aspirantes")
      .insert({ updated_by: session.id, ultima_edicion_por: session.name } as any)
      .select().single();
    if (error) return toast.error(error.message);
    setRows(r => [...r, data as AspiranteRow]);
    await logAction(supabase, session, "CREATE_ASPIRANTE", { id: data.id });
    await notifyDiscord({
      policiaId: session.id, policiaName: session.name,
      action: "Creado", section: "Aspirante", targetName: "(nuevo aspirante)",
    });
    setEditing(data as AspiranteRow);
  }

  async function deleteRow(row: AspiranteRow) {
    if (!canDelete) { toast.error("No tenés permiso para borrar agentes"); return; }
    if (!confirm(`¿Eliminar aspirante ${row.nombre || ""}?`)) return;
    const { error } = await supabase.from("aspirantes").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== row.id));
    await logAction(supabase, session, "DELETE_ASPIRANTE", { id: row.id });
    await notifyDiscord({
      policiaId: session.id, policiaName: session.name,
      action: "Borrado", section: "Aspirante",
      targetName: row.nombre || "(sin nombre)",
    });
  }

  async function clearAll() {
    if (!isComisario) return;
    if (!confirm("¿VACIAR TODA la tabla de Aspirantes?")) return;
    const { error } = await supabase.from("aspirantes").delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return toast.error(error.message);
    setRows([]);
    await logAction(supabase, session, "CLEAR_ASPIRANTES", {});
  }

  async function updatePasa(row: AspiranteRow, v: string) {
    const prev = row.pasa;
    if (prev === v) return;
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, pasa: v, ultima_edicion_por: session.name } : r));
    const { error } = await supabase.from("aspirantes").update({
      pasa: v, updated_by: session.id, ultima_edicion_por: session.name,
    }).eq("id", row.id);
    if (error) return toast.error(error.message);
    await logAction(supabase, session, "UPDATE_ASPIRANTE", { id: row.id, field: "pasa", from: prev, to: v });
    await notifyDiscord({
      policiaId: session.id, policiaName: session.name,
      action: "Editado", section: "Aspirante",
      targetName: row.nombre || "(sin nombre)",
      changes: [{ field: "pasa", from: prev, to: v }],
    });
  }

  async function exportImage() {
    const el = document.getElementById("aspirantes-table-export");
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: "#0b1a2e", pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `aspirantes-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function exportPDF() {
    const el = document.getElementById("aspirantes-table-export");
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: "#0b1a2e", pixelRatio: 2 });
    const img = new Image(); img.src = dataUrl;
    await new Promise(r => (img.onload = r));
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [img.width, img.height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
    pdf.save(`aspirantes-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading) return <p className="text-slate-400 animate-pulse">Cargando registros...</p>;

  const HEADERS = ["PASA", "NOMBRE", "DISCORD", "INSTRUCTOR", "PUNT. SELECCIÓN", "PUNT. FINAL", "NOTAS ADICIONALES", "ÚLTIMA EDICIÓN", "ACCIONES"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <p className="text-blue-300 text-xs uppercase tracking-[0.35em] font-semibold">
            San Andreas Police Department
          </p>
          <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-wide text-white font-display">
            Aspirantes
          </h2>
          <div className="mt-3 h-px w-40 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700">
                <Download className="w-4 h-4 mr-1" /> Descargar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border border-slate-700 text-white">
              <DropdownMenuItem onClick={exportImage} className="hover:bg-blue-900/40">
                <FileImage className="w-4 h-4 mr-2" /> Imagen PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF} className="hover:bg-blue-900/40">
                <Download className="w-4 h-4 mr-2" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isComisario && (
            <Button size="sm" variant="destructive" onClick={clearAll} className="shadow-lg shadow-red-900/30">
              <Eraser className="w-4 h-4 mr-1" /> Vaciar Tabla
            </Button>
          )}

          <Button onClick={addRow} size="sm" className="bg-blue-800 hover:bg-blue-700 text-white shadow-lg shadow-blue-950/50">
            <Plus className="w-4 h-4 mr-1" /> Agregar Aspirante
          </Button>
        </div>
      </div>

      <div id="aspirantes-table-export" className="border border-blue-900/60 rounded-md overflow-auto bg-slate-950/80 shadow-[0_0_45px_rgba(0,0,0,.55)]">
        <table className="w-auto text-sm border-collapse font-table">
          <thead>
            <tr className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950">
              {HEADERS.map((x, i) => (
                <th key={i} className="p-3 text-center font-bold uppercase tracking-wider text-yellow-300 border border-blue-800/60 whitespace-nowrap">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-blue-900/20 transition-colors">
                <td className="p-2 border border-blue-900/50 text-center whitespace-nowrap">
                  <PasaSelector value={row.pasa} onChange={v => updatePasa(row, v)} />
                </td>
                <td className="p-3 border border-blue-900/50 text-white whitespace-nowrap">{row.nombre || <span className="text-slate-500">—</span>}</td>
                <td className="p-3 border border-blue-900/50 text-white whitespace-nowrap">{row.dp || <span className="text-slate-500">—</span>}</td>
                <td className="p-3 border border-blue-900/50 text-white whitespace-nowrap">{row.instructor || <span className="text-slate-500">—</span>}</td>
                <td className="p-3 border border-blue-900/50 text-white text-center whitespace-nowrap">{row.puntuacion_seleccion ?? <span className="text-slate-500">—</span>}</td>
                <td className="p-3 border border-blue-900/50 text-white text-center whitespace-nowrap">{row.puntuacion_final ?? <span className="text-slate-500">—</span>}</td>
                <td className="p-3 border border-blue-900/50 text-white whitespace-pre-wrap max-w-md">{row.notas || <span className="text-slate-500">—</span>}</td>
                <td className="p-3 border border-blue-900/50 text-xs text-slate-400 whitespace-nowrap">{row.ultima_edicion_por ?? "—"}</td>
                <td className="p-2 border border-blue-900/50 text-center whitespace-nowrap">
                  <div className="flex justify-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(row)}
                      className="h-8 w-8 hover:bg-blue-900/40" title="Editar">
                      <Pencil className="w-4 h-4 text-blue-300" />
                    </Button>
                    {canDelete && (
                      <Button size="icon" variant="ghost" onClick={() => deleteRow(row)}
                        className="h-8 w-8 hover:bg-red-900/30" title="Borrar">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Sin aspirantes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditAspiranteDialog
        open={!!editing}
        onOpenChange={v => { if (!v) setEditing(null); }}
        row={editing}
        session={session}
        onSaved={load}
      />
    </div>
  );
}