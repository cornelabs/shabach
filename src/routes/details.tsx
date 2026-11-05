import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/details")({
  beforeLoad: () => {
    throw redirect({ to: "/program" });
  },
});
