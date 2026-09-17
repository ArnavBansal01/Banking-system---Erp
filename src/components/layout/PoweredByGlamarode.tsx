import React from "react";
import glamarodeLogo from "../../../image.png";

export interface PoweredByGlamarodeProps {
  className?: string;
  showLogoImage?: boolean;
  variant?: "inline" | "oval" | "floating-oval";
}

export const PoweredByGlamarode: React.FC<PoweredByGlamarodeProps> = ({
  className = "",
  showLogoImage = true,
  variant = "inline",
}) => {
  if (variant === "floating-oval") {
    return (
      <aside
        aria-label="Branding"
        className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-6 z-40 transition-all duration-300 hover:scale-[1.03] ${className}`}
      >
        <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/90 dark:bg-card/90 backdrop-blur-md px-3.5 py-1.5 shadow-lg shadow-black/5 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-200 cursor-default select-none group">
          <span className="text-[11px] font-medium text-muted-foreground/85">powered by</span>
          {showLogoImage && (
            <img
              src={glamarodeLogo}
              alt="Glamarode Technologies"
              className="h-4 w-auto object-contain inline-block shrink-0 transition-transform group-hover:scale-105"
            />
          )}
          <span className="inline-flex items-center text-[12px] font-extrabold tracking-tight">
            <span className="text-[#FF8C00]">GLAMA</span>
            <span className="text-[#00BCD4]">RODE</span>
          </span>
        </div>
      </aside>
    );
  }

  if (variant === "oval") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 dark:bg-card/80 backdrop-blur-sm px-3 py-1 shadow-xs hover:border-primary/30 transition-all cursor-default select-none ${className}`}
      >
        <span className="text-[11px] font-medium text-muted-foreground/80">powered by</span>
        {showLogoImage && (
          <img
            src={glamarodeLogo}
            alt="Glamarode Technologies"
            className="h-3.5 w-auto object-contain inline-block shrink-0"
          />
        )}
        <span className="inline-flex items-center text-[11px] font-extrabold tracking-tight">
          <span className="text-[#FF8C00]">GLAMA</span>
          <span className="text-[#00BCD4]">RODE</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground select-none transition-opacity hover:opacity-100 opacity-85 ${className}`}
    >
      <span className="text-[11px] font-normal tracking-wide text-muted-foreground/80">
        Powered by
      </span>
      {showLogoImage && (
        <img
          src={glamarodeLogo}
          alt="Glamarode Technologies"
          className="h-4 w-auto object-contain inline-block"
        />
      )}
      <span className="inline-flex items-center text-[12px] font-bold tracking-tight">
        <span className="text-[#FF8C00]">GLAMA</span>
        <span className="text-[#00BCD4]">RODE</span>
      </span>
    </div>
  );
};
