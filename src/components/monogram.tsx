import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-3xl",
} as const;

/** Hue-tinted initials placeholder for contestants (no photos in the demo). */
export function Monogram({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter((word) => /[a-z]/i.test(word.charAt(0)))
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "S";
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display font-normal",
        SIZES[size],
        className,
      )}
      style={{
        backgroundColor: `oklch(0.92 0.05 ${hue})`,
        color: `oklch(0.38 0.09 ${hue})`,
      }}
    >
      {initials}
    </div>
  );
}
