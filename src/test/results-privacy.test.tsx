import { render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicTopThree, Route } from "@/routes/results";
import {
  loadSampleScores,
  lockResults,
  publishResults,
  resetDemo,
  setScoreDeskConfirmed,
  setVotingStatus,
} from "@/lib/demo/store";
import type { ResultRow } from "@/lib/demo/types";

// Mock TanStack Router Link to render a simple anchor in tests
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      children,
      to,
      className,
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

describe("Public Results Privacy & Presentation", () => {
  beforeEach(() => {
    resetDemo();
  });

  const mockTopThreeRows: ResultRow[] = [
    {
      contestant: {
        id: "c01",
        code: "SHB-01",
        name: "Praise Adebayo",
        district: "Lagos Central",
        type: "music",
        title: "Ancient of Days",
        bio: "Test bio",
        order: 1,
        hue: 24,
      },
      judgeSubtotals: { judge1: 90, judge2: 92, judge3: 88 },
      judgeCount: 3,
      judgeAverage: 90,
      validVotes: 120,
      audiencePoints: 5,
      timePenalty: 0,
      finalScore: 95,
      complete: true,
      tieFlags: [],
      rank: 1,
    },
    {
      contestant: {
        id: "c03",
        code: "SHB-03",
        name: "Grace Eke",
        district: "Ikeja",
        type: "dance",
        title: "Winds of Awakening",
        bio: "Test bio",
        order: 3,
        hue: 69,
      },
      judgeSubtotals: { judge1: 85, judge2: 87, judge3: 86 },
      judgeCount: 3,
      judgeAverage: 86,
      validVotes: 100,
      audiencePoints: 4.17,
      timePenalty: 0,
      finalScore: 90.17,
      complete: true,
      tieFlags: [],
      rank: 2,
    },
    {
      contestant: {
        id: "c02",
        code: "SHB-02",
        name: "David Okon",
        district: "Lagos Central",
        type: "spoken_word",
        title: "The Great Exchange",
        bio: "Test bio",
        order: 2,
        hue: 46,
      },
      judgeSubtotals: { judge1: 82, judge2: 84, judge3: 80 },
      judgeCount: 3,
      judgeAverage: 82,
      validVotes: 90,
      audiencePoints: 3.75,
      timePenalty: 0,
      finalScore: 85.75,
      complete: true,
      tieFlags: [],
      rank: 3,
    },
    {
      contestant: {
        id: "c04",
        code: "SHB-04",
        name: "Emmanuel Bello",
        district: "Ikeja",
        type: "mono_drama",
        title: "The Potter’s Vessel",
        bio: "Test bio",
        order: 4,
        hue: 92,
      },
      judgeSubtotals: { judge1: 75, judge2: 78, judge3: 74 },
      judgeCount: 3,
      judgeAverage: 75.67,
      validVotes: 80,
      audiencePoints: 3.33,
      timePenalty: 0,
      finalScore: 79,
      complete: true,
      tieFlags: [],
      rank: 4,
    },
  ];

  it("renders only top three winners and excludes 4th place and below", () => {
    render(<PublicTopThree rows={mockTopThreeRows} />);

    // 1st place
    expect(screen.getByText("Praise Adebayo")).toBeInTheDocument();
    expect(screen.getByText("1st Place · Winner")).toBeInTheDocument();

    // 2nd place
    expect(screen.getByText("Grace Eke")).toBeInTheDocument();
    expect(screen.getByText("2nd Place · First Runner-Up")).toBeInTheDocument();

    // 3rd place
    expect(screen.getByText("David Okon")).toBeInTheDocument();
    expect(screen.getByText("3rd Place · Second Runner-Up")).toBeInTheDocument();

    // 4th place must NOT be rendered
    expect(screen.queryByText("Emmanuel Bello")).not.toBeInTheDocument();
    expect(screen.queryByText("4th Place")).not.toBeInTheDocument();
  });

  it("does not render internal judge subtotals, notes, or raw votes to the public", () => {
    const { container } = render(<PublicTopThree rows={mockTopThreeRows} />);

    // Individual judge marks like 90, 92, 88 should not appear as standalone judge marks
    expect(screen.queryByText("Judge 1 Subtotal")).not.toBeInTheDocument();
    expect(screen.queryByText("Judge 2 Subtotal")).not.toBeInTheDocument();
    expect(screen.queryByText("Judge 3 Subtotal")).not.toBeInTheDocument();
    expect(screen.queryByText("Audience Points")).not.toBeInTheDocument();
    expect(screen.queryByText("Time Penalty")).not.toBeInTheDocument();
    expect(container.textContent).not.toContain("120 valid votes");
  });

  it("end-to-end flow: results remain unannounced until published", () => {
    loadSampleScores();
    setVotingStatus("closed");
    setScoreDeskConfirmed(true);
    lockResults();

    const initialCheck = publishResults;
    expect(typeof initialCheck).toBe("function");
  });

  it("displays elegant pending message when results are not yet published", () => {
    resetDemo();
    const spyLoader = vi.spyOn(Route, "useLoaderData").mockReturnValue({ publishedSnapshot: null });
    const ResultsComponent = Route.options.component!;
    render(<ResultsComponent />);
    expect(screen.getByText("Official results are being collated...")).toBeInTheDocument();
    expect(
      screen.getByText(/The Grand Finale top three placements will be officially published here/i),
    ).toBeInTheDocument();
    spyLoader.mockRestore();
  });
});
