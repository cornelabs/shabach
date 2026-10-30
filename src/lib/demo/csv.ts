import type { ResultRow } from "./types";

/** Trigger a browser download of a CSV file. Call from event handlers only. */
export function downloadCsvFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}


function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function n2(value: number | null): string {
  return value === null ? "" : value.toFixed(2);
}

/** Export the collated results as CSV. Rows are exported in the order given. */
export function resultsToCsv(rows: ResultRow[]): string {
  const header = [
    "Rank",
    "Share code",
    "Contestant",
    "District",
    "Category",
    "Running order",
    "Judge 1 subtotal",
    "Judge 2 subtotal",
    "Judge 3 subtotal",
    "Judges' average",
    "Valid votes",
    "Audience points",
    "Time penalty",
    "Final score",
    "Flags",
  ];
  const lines = rows.map((r) => [
    r.rank,
    r.contestant.code,
    r.contestant.name,
    r.contestant.district,
    r.contestant.type,
    r.contestant.order,
    r.judgeSubtotals.judge1 ?? "",
    r.judgeSubtotals.judge2 ?? "",
    r.judgeSubtotals.judge3 ?? "",
    n2(r.judgeAverage),
    r.validVotes,
    n2(r.audiencePoints),
    r.timePenalty,
    n2(r.finalScore),
    r.tieFlags.join("; "),
  ]);
  return [header, ...lines].map((row) => row.map(csvCell).join(",")).join("\n");
}
