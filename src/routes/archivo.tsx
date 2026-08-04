import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { ArchivoView } from "@/components/ArchivoView";

export const Route = createFileRoute("/archivo")({
  head: () => ({
    meta: [
      { title: "Archivo de Personas · mySAPD" },
      { name: "description", content: "Archivo fotográfico de personas, vetos y capacitaciones del SAPD." },
      { property: "og:title", content: "Archivo de Personas · mySAPD" },
      { property: "og:description", content: "Archivo fotográfico de personas, vetos y capacitaciones del SAPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Protected>{s => <ArchivoView session={s} />}</Protected>,
});
