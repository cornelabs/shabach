import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Download, ExternalLink, Maximize2, Minimize2, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/screen")({
  head: () => ({
    meta: [
      { title: "Stage Screen & Audience QR Code — SHABACH 2026" },
      {
        name: "description",
        content: "Live projector and LED screen display graphic for SHABACH 2026 audience voting with high-contrast QR code.",
      },
    ],
  }),
  component: ScreenDisplayRoute,
});

export function ScreenDisplayRoute() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#030e0a] text-ivory overflow-hidden flex flex-col items-center justify-center">
      {/* Floating Control Bar for Stage Crew */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-forest/70 bg-forest-deep/80 px-4 py-2 backdrop-blur-md shadow-2xl transition-opacity hover:opacity-100 opacity-80 sm:opacity-90">
        <Button
          size="sm"
          variant="outline"
          className="border-gold/40 text-gold-wash hover:bg-gold/20 text-xs h-8"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="mr-1.5 h-3.5 w-3.5" /> Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Fullscreen Display
            </>
          )}
        </Button>

        <a
          href="/screen/shabach-2026-voting-screen-4k.png"
          download="shabach-2026-voting-screen-4k.png"
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-forest-deep transition-all hover:bg-gold-soft"
        >
          <Download className="h-3.5 w-3.5" /> 4K PNG
        </a>

        <Link
          to="/"
          className="text-xs text-ivory/70 hover:text-gold transition-colors pl-2"
        >
          Portal
        </Link>
      </div>

      {/* Embedded High-Fidelity 16:9 Display */}
      <div className="relative w-full max-w-[1920px] aspect-video max-h-screen flex items-center justify-center p-2 sm:p-4">
        <img
          src="/screen/shabach-2026-voting-screen-1080p.png"
          alt="SHABACH 2026 Audience Voting Screen"
          className="w-full h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-gold/30"
        />
      </div>
    </div>
  );
}
