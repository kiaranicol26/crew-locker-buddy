import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mySAPD · Gestión de la Policía de San Andreas" },
      { name: "description", content: "Web de gestión del San Andreas Police Department en WestZone Roleplay." },
      { property: "og:title", content: "mySAPD · Gestión de la Policía de San Andreas" },
      { property: "og:description", content: "Web de gestión del San Andreas Police Department en WestZone Roleplay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
