"use client";

import Box from "@mui/material/Box";

/** Renders step content in a non-interactive preview state (future steps in the sidebar). */
export default function GrantStepPreview({ locked, children }) {
  if (!locked) return children;

  return (
    <Box
      aria-disabled="true"
      sx={{
        position: "relative",
        "& button, & input, & textarea, & .MuiToggleButton-root, & .MuiCheckbox-root, & .ProseMirror, & .MuiIconButton-root": {
          pointerEvents: "none !important",
        },
        "& .MuiInputBase-root, & .MuiToggleButtonGroup-root, & .grant-rich-text-editor": {
          opacity: 0.88,
        },
      }}
    >
      {children}
    </Box>
  );
}
