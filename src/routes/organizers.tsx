import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organizers")({
  beforeLoad: () => {
    throw redirect({ to: "/organiser" });
  },
});
