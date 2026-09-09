import type { ReactNode } from "react";

/** Formato inline: **negrita**, *cursiva*, `código`, ~~tachado~~, [texto](url) */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(~~[^~]+~~)|(\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-i${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("~~")) out.push(<s key={key}>{tok.slice(2, -2)}</s>);
    else if (tok.startsWith("`"))
      out.push(
        <code key={key} className="px-1 py-0.5 bg-slate-200 text-slate-800 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    else if (tok.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok)!;
      out.push(
        <a key={key} href={mm[2]} target="_blank" rel="noreferrer"
          className="text-blue-700 underline break-all">
          {mm[1]}
        </a>,
      );
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Render mínimo tipo Discord/Markdown: títulos, listas, checklists,
 * citas, imágenes, separadores y bloques de código.
 */
export function Markdown({ text }: { text: string }) {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { checked: boolean | null; content: string }[] = [];
  let code: string[] | null = null;

  const flushList = (k: string) => {
    if (list.length === 0) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={k} className="space-y-1 my-2">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
            {it.checked === null ? (
              <span className="text-blue-700 font-black leading-5">•</span>
            ) : (
              <span
                className={`mt-0.5 w-4 h-4 border-2 flex items-center justify-center text-[10px] font-black ${
                  it.checked ? "border-green-600 bg-green-50 text-green-700" : "border-slate-400 text-transparent"
                }`}
              >
                ✓
              </span>
            )}
            <span className={it.checked ? "line-through text-slate-400" : ""}>
              {inline(it.content, `${k}-${idx}`)}
            </span>
          </li>
        ))}
      </ul>,
    );
  };

  lines.forEach((line, n) => {
    const key = `b${n}`;
    if (line.trim().startsWith("```")) {
      if (code === null) code = [];
      else {
        blocks.push(
          <pre key={key} className="my-2 p-3 bg-slate-900 text-slate-100 text-xs overflow-auto font-mono">
            {code.join("\n")}
          </pre>,
        );
        code = null;
      }
      return;
    }
    if (code !== null) {
      code.push(line);
      return;
    }

    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line.trim());
    if (img) {
      flushList(`${key}-l`);
      blocks.push(
        <img key={key} src={img[2]} alt={img[1] || "imagen"}
          className="my-3 max-h-[420px] border-2 border-blue-300 object-contain bg-white" />,
      );
      return;
    }

    const check = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(line);
    if (check) {
      list.push({ checked: check[1]!.toLowerCase() === "x", content: check[2]! });
      return;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      list.push({ checked: null, content: bullet[1]! });
      return;
    }
    flushList(`${key}-l`);

    if (!line.trim()) return;
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key} className="my-3 border-t-2 border-blue-200" />);
      return;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const size = h[1]!.length;
      const cls =
        size === 1 ? "text-xl" : size === 2 ? "text-lg" : "text-base";
      blocks.push(
        <p key={key} className={`${cls} font-black uppercase tracking-wide text-slate-900 mt-3 mb-1`}>
          {inline(h[2]!, key)}
        </p>,
      );
      return;
    }
    if (line.trim().startsWith(">")) {
      blocks.push(
        <blockquote key={key} className="my-2 border-l-4 border-blue-500 pl-3 text-sm text-slate-600 italic">
          {inline(line.replace(/^\s*>\s?/, ""), key)}
        </blockquote>,
      );
      return;
    }
    blocks.push(
      <p key={key} className="text-sm text-slate-700 leading-relaxed my-1">
        {inline(line, key)}
      </p>,
    );
  });
  flushList("last-l");
  if (code !== null) {
    blocks.push(
      <pre key="code-last" className="my-2 p-3 bg-slate-900 text-slate-100 text-xs overflow-auto font-mono">
        {(code as string[]).join("\n")}
      </pre>,
    );
  }

  return <div className="markdown-body">{blocks}</div>;
}
