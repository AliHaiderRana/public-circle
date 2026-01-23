import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  width?: number;
  height?: number;
  isSingle?: boolean;
  disableLink?: boolean;
  className?: string;
  href?: string;
}

/**
 * Logo Component
 * Displays the Public Circle logo (single or full version)
 */
export function Logo({
  width,
  height,
  isSingle = true,
  disableLink = false,
  className,
  href = "/dashboard",
}: LogoProps) {
  const baseSize = {
    width: width ?? (isSingle ? 40 : 202),
    height: height ?? (isSingle ? 40 : 36),
  };

  const logoContent = (
    <img
      src="/logo/PCLogo.png"
      alt="Public Circle"
      className="h-full w-auto object-contain"
      style={{ width: baseSize.width, height: baseSize.height }}
    />
  );

  if (disableLink) {
    return (
      <div
        className={cn("flex items-center flex-shrink-0", className)}
        style={baseSize}
      >
        {logoContent}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={cn("flex items-center flex-shrink-0 inline-flex", className)}
      aria-label="Public Circle Logo"
      style={baseSize}
    >
      {logoContent}
    </Link>
  );
}
