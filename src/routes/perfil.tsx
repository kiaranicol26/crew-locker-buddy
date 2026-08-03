import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { MiPerfilView } from "@/components/MiPerfilView";

export const Route = createFileRoute("/perfil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "myPerfil · mySAPD" },
      { name: "description", content: "Configura tu foto de perfil, nombre y descripción en mySAPD." },
      { property: "og:title", content: "myPerfil · mySAPD" },
      { property: "og:description", content: "Configura tu foto de perfil, nombre y descripción en mySAPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Protected>{s => <MiPerfilView session={s} />}</Protected>,
});
