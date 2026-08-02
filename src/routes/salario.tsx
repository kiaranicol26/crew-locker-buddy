import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SalarioView } from "@/components/SalarioView";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/salario")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Salario · mySAPD" },
      { name: "description", content: "Tablas mensuales de salarios del San Andreas Police Department." },
      { property: "og:title", content: "Salario · mySAPD" },
      { property: "og:description", content: "Tablas mensuales de salarios del San Andreas Police Department." },
    ],
  }),
  component: SalarioPage,
});

function SalarioPage() {
  const session = useSession();
  return (
    <AppShell session={session}>
      <SalarioView session={session} />
    </AppShell>
  );
}
