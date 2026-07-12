import { supabase } from "@/integrations/supabase/client";

const CHANGES_KEY = "discord_webhook_url";
const RNAP_KEY = "discord_rnap_webhook_url";

const cache: Record<string, { value: string; at: number }> = {};

async function getKey(key: string, force = false): Promise<string> {
  const now = Date.now();
  const c = cache[key];
  if (!force && c && now - c.at < 30_000) return c.value;
  const { data } = await supabase
    .from("app_settings").select("value").eq("key", key).maybeSingle();
  const value = (data?.value ?? "").trim();
  cache[key] = { value, at: now };
  return value;
}

async function setKey(key: string, url: string) {
  cache[key] = { value: url.trim(), at: Date.now() };
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: url.trim(), updated_at: new Date().toISOString() });
  if (error) throw error;
}

export const getWebhookUrl = (force = false) => getKey(CHANGES_KEY, force);
export const setWebhookUrl = (url: string) => setKey(CHANGES_KEY, url);
export const getRnapWebhookUrl = (force = false) => getKey(RNAP_KEY, force);
export const setRnapWebhookUrl = (url: string) => setKey(RNAP_KEY, url);

export async function sendRnapToDiscord(params: {
  editorName: string;
  targetName: string;
  imageBlob: Blob;
}) {
  const url = await getRnapWebhookUrl();
  if (!url) throw new Error("Webhook de RNAP no configurado");
  const fd = new FormData();
  const payload = {
    username: "SAPD · R.N.A.P",
    embeds: [{
      title: "Certificado R.N.A.P Emitido",
      color: 0xeab308,
      fields: [
        { name: "Emitido por", value: params.editorName, inline: true },
        { name: "Persona", value: params.targetName || "—", inline: true },
      ],
      image: { url: "attachment://rnap.png" },
      timestamp: new Date().toISOString(),
      footer: { text: "San Andreas Police Department" },
    }],
  };
  fd.append("payload_json", JSON.stringify(payload));
  fd.append("files[0]", params.imageBlob, "rnap.png");
  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Discord respondió ${res.status}`);
}

export type ChangeAction = "Creado" | "Editado" | "Borrado";

export async function notifyDiscord(params: {
  policiaId?: string;
  policiaName: string;
  action: ChangeAction;
  section: "Ex Policía" | "Aspirante";
  targetName: string;
  changes?: { field: string; from?: any; to?: any }[];
}) {
  const url = await getWebhookUrl();
  if (!url) return;

  const color =
    params.action === "Creado" ? 0x22c55e :
    params.action === "Borrado" ? 0xef4444 : 0x3b82f6;

  const fields: any[] = [
    { name: "Editado por", value: params.policiaName, inline: true },
    { name: "Persona", value: params.targetName || "—", inline: true },
    { name: "Acción", value: `**${params.action}** · ${params.section}`, inline: false },
  ];

  const FIELD_LABELS: Record<string, string> = {
    rango_old: "Ex Rango",
    rango_new: "Rango Reingreso",
    nombre_old: "Nombre Anterior",
    nombre_new: "Nombre Nuevo",
    motivo: "Motivo",
    discord: "Discord",
    pasa: "Pasa",
    nota_final: "Nota Final",
    instructor_asignado: "Nota Adicional",
    nombre: "Nombre",
    dp: "DP",
    instructor: "Instructor",
    puntuacion_seleccion: "Punt. Selección",
    puntuacion_final: "Punt. Final",
    notas: "Notas",
  };

  if (params.changes && params.changes.length) {
    const txt = params.changes.map(c => {
      const from = c.from === undefined || c.from === null || c.from === "" ? "—" : String(c.from);
      const to = c.to === undefined || c.to === null || c.to === "" ? "—" : String(c.to);
      const label = FIELD_LABELS[c.field] ?? c.field;
      return `• **${label}**: \`${from}\` → \`${to}\``;
    }).join("\n").slice(0, 1000);
    fields.push({ name: "Valores editados", value: txt, inline: false });
  }

  const body = {
    username: "SAPD · Gestión Policial",
    embeds: [{
      title: `${params.action} — ${params.section}`,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: "San Andreas Police Department" },
    }],
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("discord webhook failed", e);
  }
}