import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/judge")({
  beforeLoad: () => {
    throw redirect({ to: "/judges" });
  },
});
