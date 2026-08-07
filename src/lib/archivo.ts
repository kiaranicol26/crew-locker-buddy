import { db } from "@/lib/db";

export const normName = (s?: string | null) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Crea automáticamente la ficha de Archivo cuando se emite un Antecedente (RNAP),
 * si todavía no existe una persona con ese nombre.
 */
export async function ensureArchivoPersona(nombre: string, foto: string | null) {
  const clean = nombre.trim();
  if (!clean) return;
  const { data } = await db.from("archivo_personas").select("id, nombre");
  const exists = (data ?? []).some((p: any) => normName(p.nombre) === normName(clean));
  if (exists) return;
  await db.from("archivo_personas").insert({ nombre: clean, foto });
}
