"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BRAND, LOGO_ASPECT_HORIZONTAL, LOGO_ASPECT_SVG } from "@/lib/brand";

/** Default navbar / marketing header logo height. */
export const NAV_LOGO_HEIGHT = 64;

/**
 * @param {object} props
 * @param {number} [props.height=32]
 * @param {"svg"|"png"|"white"} [props.format="svg"] — `white` for dark backgrounds (logo-white.png)
 * @param {string} [props.subtitle]
 * @param {"light"|"dark"} [props.subtitleTone="light"]
 * @param {import("@mui/material").SxProps} [props.sx]
 * @param {() => void} [props.onClick]
 * @param {"left"|"center"} [props.align="left"]
 */
export default function BrandLogo({
  height = 32,
  format = "svg",
  subtitle,
  subtitleTone = "light",
  align = "left",
  sx,
  onClick,
}) {
  const src =
    format === "white" ? "/logo-white.png" : format === "png" ? "/logo.png" : "/logo.svg";
  const aspect =
    format === "png" || format === "white" ? LOGO_ASPECT_HORIZONTAL : LOGO_ASPECT_SVG;
  const width = Math.round(height * aspect);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt="TemplumIS"
        sx={{
          height,
          width,
          minHeight: height,
          minWidth: width,
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: align === "center" ? "center center" : "left center",
          display: "block",
          flexShrink: 0,
        }}
      />
      {subtitle ? (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: 0.2,
            color: subtitleTone === "dark" ? BRAND.navyMuted : BRAND.slate,
            textTransform: "none",
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
