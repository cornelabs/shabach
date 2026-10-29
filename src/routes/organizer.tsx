import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organizer")({
  beforeLoad: () => {
    throw redirect({ to: "/organiser" });
  },
});

