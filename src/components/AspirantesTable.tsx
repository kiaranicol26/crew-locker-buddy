import { useEffect, useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
import { db } from "@/lib/db";
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
    const { data, error } = await db
      .from("aspirantes").select("*").order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as AspiranteRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addRow() {
    const { data, error } = await db
      .from("aspirantes")
      .insert({ updated_by: session.id, ultima_edicion_por: session.name } as any)
      .select().single();
    if (error) return toast.error(error.message);
    setRows(r => [...r, data as AspiranteRow]);
    await logAction(db, session, "CREATE_ASPIRANTE", { id: data.id });
    await notifyDiscord({
      policiaId: session.id, policiaName: session.name,
      action: "Creado", section: "Aspirante", targetName: "(nuevo aspirante)",
    });
    setEditing(data as AspiranteRow);
  }

  async function deleteRow(row: AspiranteRow) {
    if (!canDelete) { toast.error("No tenés permiso para borrar agentes"); return; }
    if (!confirm(`¿Eliminar aspirante ${row.nombre || ""}?`)) return;
    const { error } = await db.from("aspirantes").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== row.id));
    await logAction(db, session, "DELETE_ASPIRANTE", { id: row.id });
    await notifyDiscord({
      policiaId: session.id, policiaName: session.name,
      action: "Borrado", section: "Aspirante",
      targetName: row.nombre || "(sin nombre)",
    });
  }

  async function clearAll() {
    if (!isComisario) return;
    if (!confirm("¿VACIAR TODA la tabla de Aspirantes?")) return;
    const { error } = await db.from("aspirantes").delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return toast.error(error.message);
    setRows([]);
    await logAction(db, session, "CLEAR_ASPIRANTES", {});
  }

  async function updatePasa(row: AspiranteRow, v: string) {
    const prev = row.pasa;
    if (prev === v) return;
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, pasa: v, ultima_edicion_por: session.name } : r));
    const { error } = await db.from("aspirantes").update({
      pasa: v, updated_by: session.id, ultima_edicion_por: session.name,
    }).eq("id", row.id);
    if (error) return toast.error(error.message);
    await logAction(db, session, "UPDATE_ASPIRANTE", { id: row.id, field: "pasa", from: prev, to: v });
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
    const dataUrl = await toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `aspirantes-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function exportPDF() {
    const el = document.getElementById("aspirantes-table-export");
    if (!el) return;
    const dataUrl = await toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 });
    const img = new Image(); img.src = dataUrl;
    await new Promise(r => (img.onload = r));
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [img.width, img.height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
    pdf.save(`aspirantes-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading) return <p className="text-blue-600 animate-pulse">Cargando registros...</p>;

  const HEADERS = ["PASA", "NOMBRE", "DISCORD", "INSTRUCTOR", "PUNT. SELECCIÓN", "PUNT. FINAL", "NOTAS ADICIONALES", "ÚLTIMA EDICIÓN", "ACCIONES"];

  return (
    <div className="space-y-4">
      <div className="w-full bg-white border border-blue-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-white border border-blue-200 p-1">
              <img src={sapdLogo.url} alt="SAPD" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-blue-600 text-xs uppercase font-bold tracking-[0.3em]">
                San Andreas Police Department
              </p>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase">
                Aspirantes
              </h2>
              <p className="text-slate-500 text-sm">Sistema de Gestión de Aspirantes</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-none">
                  <Download className="w-4 h-4 mr-2" /> Descargar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border border-blue-200 text-slate-800 rounded-none">
                <DropdownMenuItem onClick={exportImage} className="hover:bg-blue-50 cursor-pointer">
                  <FileImage className="w-4 h-4 mr-2 text-blue-600" /> Imagen PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF} className="hover:bg-blue-50 cursor-pointer">
                  <Download className="w-4 h-4 mr-2 text-blue-600" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isComisario && (
              <Button size="sm" variant="destructive" onClick={clearAll} className="rounded-none font-bold">
                <Eraser className="w-4 h-4 mr-2" /> Vaciar Tabla
              </Button>
            )}

            <Button onClick={addRow} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-none font-bold">
              <Plus className="w-4 h-4 mr-2" /> Agregar Aspirante
            </Button>
          </div>
        </div>
      </div>

      <div id="aspirantes-table-export" className="w-full bg-white border border-blue-200 shadow-sm">
        <table className="w-full border-collapse text-sm font-table">
          <thead>
            <tr className="bg-blue-600 text-white">
              {HEADERS.map((x, i) => (
                <th key={i} className="p-3 border border-blue-500 text-center uppercase font-bold whitespace-nowrap">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                  <PasaSelector value={row.pasa} onChange={v => updatePasa(row, v)} />
                </td>
                <td className="p-3 border border-slate-200 text-slate-700 whitespace-nowrap">{row.nombre || <span className="text-slate-400">—</span>}</td>
                <td className="p-3 border border-slate-200 text-slate-700 whitespace-nowrap">{row.dp || <span className="text-slate-400">—</span>}</td>
                <td className="p-3 border border-slate-200 text-slate-700 whitespace-nowrap">{row.instructor || <span className="text-slate-400">—</span>}</td>
                <td className="p-3 border border-slate-200 text-slate-700 text-center whitespace-nowrap">{row.puntuacion_seleccion ?? <span className="text-slate-400">—</span>}</td>
                <td className="p-3 border border-slate-200 text-slate-700 text-center whitespace-nowrap">{row.puntuacion_final ?? <span className="text-slate-400">—</span>}</td>
                <td className="p-3 border border-slate-200 text-slate-700 whitespace-pre-wrap max-w-md">{row.notas || <span className="text-slate-400">—</span>}</td>
                <td className="p-3 border border-slate-200 text-xs text-slate-500 whitespace-nowrap">{row.ultima_edicion_por ?? "—"}</td>
                <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                  <div className="flex justify-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(row)}
                      className="h-8 w-8 rounded-none hover:bg-blue-100" title="Editar">
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    {canDelete && (
                      <Button size="icon" variant="ghost" onClick={() => deleteRow(row)}
                        className="h-8 w-8 rounded-none hover:bg-red-100" title="Borrar">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-10 text-center text-slate-400 uppercase tracking-widest">
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
