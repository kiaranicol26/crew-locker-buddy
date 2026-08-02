import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { AltoMando } from "@/components/AltoMando";

export const Route = createFileRoute("/alto-mando")({
  head: () => ({
    meta: [
      { title: "Alto Mando · mySAPD" },
      { name: "description", content: "Panel de administración del Alto Mando del SAPD." },
      { property: "og:title", content: "Alto Mando · mySAPD" },
      { property: "og:description", content: "Panel de administración del Alto Mando del SAPD." },
    ],
  }),
  component: () => <Protected altoMando>{s => <AltoMando session={s} />}</Protected>,
});
