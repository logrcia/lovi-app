import { cn } from "@/lib/utils";
import type { MediaType } from "@/lib/types";

export function MediaItem({
  type,
  src,
  alt,
  className,
  objectFit = "cover",
}: {
  type: MediaType;
  src: string | null | undefined;
  alt?: string;
  className?: string;
  objectFit?: "cover" | "contain";
}) {
  if (!src) return null;
  switch (type) {
    case "image":
      return (
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          className={cn("h-full w-full", className)}
          style={{ objectFit }}
        />
      );
    case "video":
      return (
        <video
          src={src}
          controls
          preload="metadata"
          className={cn("h-full w-full", className)}
          style={{ objectFit }}
        />
      );
    case "audio":
      return <audio src={src} controls preload="metadata" className={cn("w-full", className)} />;
  }
}