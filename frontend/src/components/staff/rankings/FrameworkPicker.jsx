"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import TuneIcon from "@mui/icons-material/Tune";
import { ST } from "@/lib/staffTheme";
import { RANKING_FRAMEWORK_CATALOG, RANKING_FRAMEWORK_GROUPS } from "@/lib/rankings/catalog";
import { MutedNote } from "./ui";

/**
 * Checkbox list of frameworks, grouped. Used by the University Rankings Summary picker and
 * the export dialog. `available` limits what can be ticked.
 */
export function FrameworkChecklist({ available, selected, onChange, dense = false }) {
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (next.length) onChange(available.filter((x) => next.includes(x)));
  };
  return (
    <Box>
      {RANKING_FRAMEWORK_GROUPS.map((group) => {
        const items = RANKING_FRAMEWORK_CATALOG.filter((f) => f.group === group.id && available.includes(f.id));
        if (!items.length) return null;
        return (
          <Box key={group.id} sx={{ mb: dense ? 0.5 : 1 }}>
            <Typography
              variant="overline"
              sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 0.8, lineHeight: 2 }}
            >
              {group.label}
            </Typography>
            {items.map((f) => (
              <FormControlLabel
                key={f.id}
                sx={{ display: "flex", ml: 0, my: -0.25 }}
                control={
                  <Checkbox
                    size="small"
                    checked={selected.includes(f.id)}
                    disabled={selected.length === 1 && selected.includes(f.id)}
                    onChange={() => toggle(f.id)}
                  />
                }
                label={<Typography variant="body2">{f.label}</Typography>}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

export default function FrameworkPicker({ available, selected, onChange }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<TuneIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderColor: ST.colors.border,
          color: ST.colors.textPrimary,
        }}
      >
        Frameworks ({selected.length} of {available.length})
      </Button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { p: 2, width: 320, maxHeight: 480 } } }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Frameworks in this summary
        </Typography>
        <MutedNote sx={{ mb: 1 }}>
          Your choice is remembered on this device. Your institution admin controls which frameworks are available.
        </MutedNote>
        <FrameworkChecklist available={available} selected={selected} onChange={onChange} />
        <Divider sx={{ my: 1 }} />
        <Button
          size="small"
          onClick={() => onChange(available)}
          disabled={selected.length === available.length}
          sx={{ textTransform: "none" }}
        >
          Select all available
        </Button>
      </Popover>
    </>
  );
}
