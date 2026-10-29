import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organisers")({
  beforeLoad: () => {
    throw redirect({ to: "/organiser" });
  },
});

