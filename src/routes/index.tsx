import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Public landing → home page (AuthGate on home renders login if locked).
    throw redirect({ to: "/home" });
  },
});
