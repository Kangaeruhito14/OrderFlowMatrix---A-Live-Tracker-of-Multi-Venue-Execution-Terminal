import Image from "next/image";

/**
 * Renders theme-specific artwork: the dark variant in dark mode, the light
 * variant in light mode (CSS-only switch — no hydration flicker).
 */
export default function ThemeImage({
  dark,
  light,
  alt,
  width,
  height,
  sizes,
  className,
  priority,
}: {
  dark: string;
  light: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={dark}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`hidden dark:block ${className ?? ""}`}
      />
      <Image
        src={light}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`dark:hidden ${className ?? ""}`}
      />
    </>
  );
}
