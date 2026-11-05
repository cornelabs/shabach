import * as React from "react";
import { Monogram } from "@/components/monogram";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
} as const;

export interface ContestantAvatarProps {
  name: string;
  avatarUrl?: string | null | undefined;
  hue: number;
  size?: keyof typeof SIZES;
  className?: string;
  alt?: string;
}

export function ContestantAvatar({
  name,
  avatarUrl,
  hue,
  size = "md",
  className,
  alt,
}: ContestantAvatarProps) {
  const [loadFailed, setLoadFailed] = React.useState(false);

  // If avatar URL is provided and has not failed loading, display the photo
  if (avatarUrl && !loadFailed) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-cream-line bg-parchment shadow-xs",
          SIZES[size],
          className,
        )}
      >
        <img
          src={avatarUrl}
          alt={alt || `${name} contestant photo`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setLoadFailed(true)}
        />
      </div>
    );
  }

  // Graceful fallback to hue-tinted monogram
  return (
    <Monogram
      name={name}
      hue={hue}
      size={size}
      {...(className ? { className } : {})}
    />
  );
}
