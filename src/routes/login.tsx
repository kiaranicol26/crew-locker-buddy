import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginView } from "@/components/LoginView";
import { useSessionState } from "@/lib/session";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso · mySAPD" },
      { name: "description", content: "Acceso al sistema interno del San Andreas Police Department." },
      { property: "og:title", content: "Acceso · mySAPD" },
      { property: "og:description", content: "Acceso al sistema interno del San Andreas Police Department." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, ready } = useSessionState();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && session) navigate({ to: "/exsapd", replace: true });
  }, [ready, session, navigate]);

  return <LoginView />;
}
