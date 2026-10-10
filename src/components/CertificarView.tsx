import { useRef, useState } from "react";
import sapdLogo from "@/assets/sapd-logo.png.asset.json";
import tpl from "@/assets/certificado-capacitacion.png.asset.json";
import { db } from "@/lib/db";
import { Session, logAction } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";
import { toPng } from "html-to-image";

const TIPOS = [
  { value: "Arma M4", clase: "ARMA DE FUEGO M4", categoria: "M4" },
  { value: "Arma EDC", clase: "ARMA DE FUEGO EDC", categoria: "EDC" },
  { value: "Arma SNIPER", clase: "ARMA DE FUEGO SNIPER", categoria: "SNIPER" },
  { value: "Arma AK-47", clase: "ARMA DE FUEGO AK-47", categoria: "AK-47" },
  { value: "Vehiculo Mary", clase: "VEHÍCULO POLICIAL MARY", categoria: "MARY" },
  { value: "Vehiculo Air", clase: "VEHÍCULO AÉREO AIR", categoria: "AIR" },
] as const;

type Form = {
  tipo: string;
  nombre: string;
  instructor: string;
  comisario: string;
  fecha: string;
  numero: string;
};

function randomNumero() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function emptyForm(session: Session): Form {
  const d = new Date();
  const fecha = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return {
    tipo: TIPOS[0].value,
    nombre: "",
    instructor: session.name,
    comisario: "",
    fecha,
    numero: randomNumero(),
  };
}

export function CertificarView({ session }: { session: Session }) {
  const [form, setForm] = useState<Form | null>(null);
  const [preview, setPreview] = useState<Form | null>(null);

  function openCreate() {
    setForm(emptyForm(session));
  }

  async function generar() {
    if (!form) return;
    if (!form.nombre.trim()) return toast.error("Escribí el nombre de la persona a certificar");
    if (!form.instructor.trim()) return toast.error("Escribí el nombre del instructor");
    if (!form.comisario.trim()) return toast.error("Escribí el nombre del comisario");
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.fecha.trim()))
      return toast.error("La fecha debe tener el formato DD/MM/AAAA");
    setPreview(form);
    setForm(null);
    await logAction(db, session, "CREATE_CERTIFICADO", { nombre: form.nombre, tipo: form.tipo });
  }

  return (
    <div className="space-y-4">
      <div className="w-full bg-white border border-blue-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-white border border-blue-200 p-1">
            <img src={sapdLogo.url} alt="SAPD" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-blue-600 text-xs uppercase tracking-[0.3em] font-bold">
              San Andreas Police Department
            </p>
            <h2 className="text-2xl font-black text-slate-900 uppercase font-display">
              Certificar — Certificados de Capacitación
            </h2>
            <p className="text-slate-500 text-sm">
              Completá el formulario y descargá el certificado en PNG de alta resolución.
            </p>
          </div>
          <Button onClick={openCreate} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Crear Certificado
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="w-full bg-white border border-blue-200 shadow-sm p-5">
          <CertCard data={preview} downloadable />
        </div>
      ) : (
        <p className="text-slate-500 italic">
          Todavía no generaste ningún certificado. Pulsá “Crear Certificado”.
        </p>
      )}

      {form && (
        <Dialog open onOpenChange={(v) => !v && setForm(null)}>
          <DialogContent className="max-w-6xl bg-white border border-blue-200 text-slate-900 rounded-none max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-wide text-blue-700">
                Crear Certificado
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6 py-2">
              <div className="space-y-3">
                <Field label="Tipo de certificado">
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger className="rounded-none border-blue-300 bg-white text-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {TIPOS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Persona a certificar">
                  <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="rounded-none border-blue-300 bg-white text-slate-800" placeholder="Nombre Apellido" />
                </Field>
                <Field label="Instructor">
                  <Input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })}
                    className="rounded-none border-blue-300 bg-white text-slate-800" placeholder="Nombre Apellido" />
                </Field>
                <Field label="Comisario">
                  <Input value={form.comisario} onChange={e => setForm({ ...form, comisario: e.target.value })}
                    className="rounded-none border-blue-300 bg-white text-slate-800" placeholder="Nombre Apellido" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fecha (DD/MM/AAAA)">
                    <Input value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                      className="rounded-none border-blue-300 bg-white text-slate-800" placeholder="01/01/2026" />
                  </Field>
                  <Field label="Nº de certificado">
                    <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
                      className="rounded-none border-blue-300 bg-white text-slate-800" />
                  </Field>
                </div>
              </div>

              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wider mb-2">Vista Previa</div>
                <CertCard data={form} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setForm(null)} className="rounded-none border-blue-300">
                Cancelar
              </Button>
              <Button onClick={generar} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white">
                Generar Certificado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label className="text-blue-600 text-xs uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

const NAVY = "#12294f";
const BLACK = "#111111";

function M4Icon() {
  return (
    <svg viewBox="0 0 200 70" fill={BLACK} aria-hidden>
      <path d="M4 44 L34 42 L38 34 L44 34 L46 40 L96 40 L100 32 L106 32 L108 40 L150 40 L150 34 L158 34 L158 42 L198 42 L198 48 L158 48 L158 52 L118 52 L114 64 L102 64 L100 52 L94 52 L90 60 L68 60 L64 52 L40 52 L36 50 L4 50 Z" />
      <rect x="108" y="36" width="10" height="6" />
    </svg>
  );
}

function AkIcon() {
  return (
    <svg viewBox="0 0 200 70" fill={BLACK} aria-hidden>
      <path d="M4 50 L30 38 L92 36 L96 30 L102 30 L104 36 L150 36 L150 32 L156 32 L156 38 L198 38 L198 44 L156 44 L156 48 L112 48 L106 62 Q92 70 80 62 L86 48 L62 50 L58 58 L46 58 L48 50 L34 52 L30 56 L4 56 Z" />
    </svg>
  );
}

function SniperIcon() {
  return (
    <svg viewBox="0 0 200 70" fill={BLACK} aria-hidden>
      <path d="M2 42 L36 40 L66 38 L66 32 L112 32 L112 38 L150 38 L154 34 L158 38 L199 38 L199 44 L158 44 L158 48 L118 48 L114 58 L102 58 L100 48 L94 48 L90 56 L70 56 L66 48 L38 48 L34 46 L2 46 Z" />
      <rect x="70" y="24" width="38" height="8" rx="2" />
      <path d="M150 48 L142 66 L148 66 L156 48 Z" />
    </svg>
  );
}

function SpasIcon() {
  return (
    <svg viewBox="0 0 200 70" fill={BLACK} aria-hidden>
      <path d="M4 42 L36 40 L38 34 L100 34 L100 40 L198 40 L198 46 L100 46 L100 50 L82 50 L80 58 L68 58 L70 50 L44 48 L40 52 L4 50 Z" />
      <rect x="110" y="46" width="46" height="8" rx="2" />
    </svg>
  );
}

function MotoIcon() {
  return (
    <svg viewBox="0 0 200 100" fill="none" stroke={BLACK} strokeWidth="8" aria-hidden>
      <circle cx="45" cy="72" r="20" />
      <circle cx="155" cy="72" r="20" />
      <path d="M45 72 L78 38 L112 38 L124 56 L155 72 M78 38 L72 26 L98 26 L110 38 M124 56 L100 72 L62 72" />
      <path d="M98 26 L92 16 L78 16" />
    </svg>
  );
}

function HeliIcon() {
  return (
    <svg viewBox="0 0 200 100" fill={BLACK} stroke={BLACK} strokeWidth="6" aria-hidden>
      <ellipse cx="80" cy="56" rx="46" ry="22" />
      <path d="M124 48 L188 36 L188 48 L128 62 Z" stroke="none" />
      <path d="M182 24 L182 44" fill="none" />
      <path d="M80 34 L80 20 M26 20 L134 20" fill="none" />
      <path d="M52 80 L52 90 M108 80 L108 90 M40 90 L122 90" fill="none" />
      <rect x="60" y="44" width="26" height="14" fill="#f7f3ea" stroke="none" />
    </svg>
  );
}

const ICONS: Record<string, () => React.ReactElement> = {
  M4: M4Icon,
  EDC: SpasIcon,
  SNIPER: SniperIcon,
  "AK-47": AkIcon,
  MARY: MotoIcon,
  AIR: HeliIcon,
};

export function CertCard({ data, downloadable = false }: { data: Form; downloadable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipo = TIPOS.find(t => t.value === data.tipo) ?? TIPOS[0];

  async function download() {
    if (!ref.current) return;
    try {
      const w = ref.current.offsetWidth || 1357;
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: Math.max(2, 1357 / w),
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Certificado_${(data.nombre || "SAPD").replace(/\s+/g, "_")}_${tipo.categoria}.png`;
      a.click();
    } catch (e: any) {
      toast.error("No se pudo descargar: " + (e?.message ?? "error"));
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="relative w-full mx-auto select-none"
        style={{ aspectRatio: "1357 / 1920", containerType: "inline-size" }}
      >
        <img src={tpl.url} alt="Certificado" className="absolute inset-0 w-full h-full" draggable={false} />

        {/* Persona a certificar */}
        <Centered top="44.5%" size="4.6cqw" spacing="0.06em">
          {(data.nombre || "NOMBRE APELLIDO").toUpperCase()}
        </Centered>

        {/* Clase / categoría / objeto */}
        <Centered top="59.7%" size="2.1cqw" weight={700}>
          {tipo.clase}
        </Centered>

        {/* Pictograma del objeto dentro del recuadro */}
        <div
          className="absolute"
          style={{
            top: "63.4%",
            left: "50%",
            width: "16.5%",
            transform: "translateX(-50%)",
          }}
        >
          {(() => {
            const Icon = ICONS[tipo.categoria] ?? M4Icon;
            return <Icon />;
          })()}
        </div>

        {/* Tapa el "CATEGORIA" impreso de la plantilla */}
        <div
          className="absolute"
          style={{
            top: "73.6%",
            left: "50%",
            width: "15%",
            height: "2.8%",
            transform: "translateX(-50%)",
            background: "#fcf6ed",
          }}
        />

        {/* Categoría dentro del recuadro */}
        <Centered top="74.2%" size="2.3cqw" weight={800} spacing="0.04em">
          {tipo.categoria}
        </Centered>

        {/* Firmas */}
        <Centered top="75.8%" left="24%" width="30%" size="2.2cqw" weight={600}>
          {(data.instructor || "NOMBRE APELLIDO").toUpperCase()}
        </Centered>
        <Centered top="75.8%" left="76%" width="30%" size="2.2cqw" weight={600}>
          {(data.comisario || "NOMBRE APELLIDO").toUpperCase()}
        </Centered>

        {/* Fecha */}
        <div
          className="absolute"
          style={{
            left: "24.5%", top: "89.6%", width: "22%",
            color: NAVY, fontSize: "1.8cqw", fontWeight: 600, textAlign: "center", lineHeight: 1,
          }}
        >
          {data.fecha || "DD/MM/AAAA"}
        </div>

        {/* Nº de certificado */}
        <div
          className="absolute"
          style={{
            left: "76%", top: "89.6%", width: "20%",
            color: NAVY, fontSize: "1.8cqw", fontWeight: 600, textAlign: "center", lineHeight: 1,
          }}
        >
          {data.numero}
        </div>
      </div>

      {downloadable && (
        <div className="flex justify-end">
          <Button onClick={download} className="rounded-none bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-1" /> Descargar PNG
          </Button>
        </div>
      )}
    </div>
  );
}

function Centered({
  top, left = "50%", width = "80%", size, weight = 500, spacing, children,
}: {
  top: string; left?: string; width?: string; size: string;
  weight?: number; spacing?: string; children: React.ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left,
        width,
        transform: "translateX(-50%)",
        textAlign: "center",
        color: NAVY,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: spacing,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}
