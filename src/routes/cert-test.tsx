import { createFileRoute } from "@tanstack/react-router";
import { CertCard } from "@/components/CertificarView";

export const Route = createFileRoute("/cert-test")({
  component: () => (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <CertCard data={{ tipo: "Arma M4", nombre: "Kendo Lockser", instructor: "Inst Ructor", comisario: "Comi Sario", fecha: "22/09/2026", numero: "123456" }} />
      <CertCard data={{ tipo: "Vehiculo Air", nombre: "Kendo Lockser", instructor: "Inst Ructor", comisario: "Comi Sario", fecha: "22/09/2026", numero: "123456" }} />
      <CertCard data={{ tipo: "Vehiculo Mary", nombre: "Kendo Lockser", instructor: "Inst Ructor", comisario: "Comi Sario", fecha: "22/09/2026", numero: "123456" }} />
    </div>
  ),
});
