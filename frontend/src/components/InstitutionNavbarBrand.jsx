"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ST } from "@/lib/staffTheme";

/**
 * Top-navbar institution identity: logo when set, otherwise large bold name.
 */
export default function InstitutionNavbarBrand({
  name,
  logoUrl,
  subtitle,
  fallbackName,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !imgFailed;
  const label = name || fallbackName || "";

  useEffect(() => {
    setImgFailed(false);
  }, [logoUrl]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 0,
        flex: 1,
        mr: 2,
      }}
    >
      {showLogo ? (
        <Box
          component="img"
          src={logoUrl}
          alt={label}
          onError={() => setImgFailed(true)}
          sx={{
            height: { xs: 36, sm: 44 },
            maxWidth: { xs: 140, sm: 240 },
            width: "auto",
            objectFit: "contain",
            objectPosition: "left center",
            display: "block",
            flexShrink: 0,
          }}
        />
      ) : label ? (
        <Typography
          component="p"
          sx={{
            fontWeight: 800,
            fontSize: { xs: 18, sm: 22 },
            letterSpacing: -0.4,
            lineHeight: 1.15,
            color: ST.colors.textPrimary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      ) : null}
      {subtitle ? (
        <Typography
          variant="body2"
          sx={{
            color: ST.colors.textSecondary,
            display: { xs: "none", md: "block" },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            borderLeft: `1px solid ${ST.colors.border}`,
            pl: 1.5,
            ml: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
