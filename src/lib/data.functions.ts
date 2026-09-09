import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const filterSchema = z.object({
  type: z.enum(["eq", "neq"]),
  column: z.string().max(64),
  value: z.any(),
});

const querySchema = z.object({
  token: z.string().max(4096).nullable().optional(),
  table: z.string().max(64),
  op: z.enum(["select", "insert", "update", "delete", "upsert"]),
  columns: z.string().max(500).nullable().optional(),
  order: z
    .object({ column: z.string().max(64), ascending: z.boolean() })
    .nullable()
    .optional(),
  limit: z.number().int().min(1).max(1000).nullable().optional(),
  filters: z.array(filterSchema).max(10).optional(),
  values: z.any().optional(),
  returning: z.string().max(500).nullable().optional(),
  single: z.enum(["single", "maybeSingle"]).nullable().optional(),
});

export const dbQuery = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => querySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyToken, runQuery } = await import("@/lib/dbAuth.server");
    const { token, ...spec } = data;
    const claims = verifyToken(token ?? null);
    try {
      return await runQuery(spec as any, claims, supabaseAdmin as any);
    } catch (e) {
      return { data: null, error: { message: (e as Error).message || "No autorizado" } };
    }
  });

export const loginWithId = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().trim().min(1).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { issueToken } = await import("@/lib/dbAuth.server");

    const { data: row } = await supabaseAdmin
      .from("instructors")
      .select("id, name, is_alto_mando, can_delete, can_emit_rnap, can_edit_files, can_edit_pd, role, avatar_url, descripcion")
      .eq("id", data.id)
      .maybeSingle();

    if (!row) return { ok: false as const };

    const r = row as any;
    const session = {
      id: r.id as string,
      name: r.name as string,
      is_alto_mando: !!r.is_alto_mando,
      can_delete: !!r.is_alto_mando || !!r.can_delete,
      can_emit_rnap: !!r.is_alto_mando || !!r.can_emit_rnap,
      can_edit_files: !!r.is_alto_mando || !!r.can_edit_files,
      can_edit_pd: !!r.is_alto_mando || !!r.can_edit_pd,
      avatar_url: (r.avatar_url ?? null) as string | null,
      role: (r.role ?? null) as string | null,
      descripcion: (r.descripcion ?? null) as string | null,
    };

    const token = issueToken({
      id: session.id,
      name: session.name,
      alto: session.is_alto_mando,
      del: session.can_delete,
      rnap: session.can_emit_rnap,
      files: session.can_edit_files,
      pd: session.can_edit_pd,
      role: session.role,
    });


    return { ok: true as const, session, token };
  });
