"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import TuneIcon from "@mui/icons-material/Tune";
import { ST } from "@/lib/staffTheme";

export default function DashboardScreenOptions({
  open,
  onToggle,
  layout,
  onToggleVisible,
  onMoveWidget,
  onReorderWidget,
  onReset,
  labels,
}) {
  const [dragId, setDragId] = useState(null);

  return (
    <Box className="analytics-no-print">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: open ? 0 : 1 }}>
        <Button
          size="small"
          startIcon={<TuneIcon />}
          onClick={onToggle}
          sx={{ textTransform: "none", color: ST.colors.textSecondary, fontWeight: 600 }}
        >
          {labels.screenOptions}
        </Button>
      </Box>
      <Collapse in={open}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            border: `1px solid ${ST.colors.border}`,
            borderRadius: 2,
            bgcolor: ST.colors.bg,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{labels.screenOptions}</Typography>
              <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{labels.screenOptionsSub}</Typography>
            </Box>
            <Button size="small" onClick={onReset} sx={{ textTransform: "none", flexShrink: 0 }}>
              {labels.resetLayout}
            </Button>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {layout.map((w, idx) => (
              <Box
                key={w.id}
                draggable={!w.locked}
                onDragStart={() => setDragId(w.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId && dragId !== w.id) onReorderWidget(dragId, w.id);
                  setDragId(null);
                }}
                onDragEnd={() => setDragId(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  p: 0.75,
                  borderRadius: 1,
                  bgcolor: dragId === w.id ? ST.colors.primaryLight : "transparent",
                  border: `1px solid ${ST.colors.border}`,
                  opacity: w.locked ? 0.7 : 1,
                }}
              >
                {!w.locked && (
                  <DragIndicatorIcon sx={{ fontSize: 18, color: ST.colors.textSecondary, cursor: "grab" }} />
                )}
                <FormControlLabel
                  sx={{ flex: 1, m: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={w.visible}
                      disabled={w.locked}
                      onChange={() => onToggleVisible(w.id)}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {w.label}
                      {w.locked && (
                        <Typography component="span" variant="caption" sx={{ ml: 1, color: ST.colors.textSecondary }}>
                          ({labels.alwaysVisible})
                        </Typography>
                      )}
                    </Typography>
                  }
                />
                {!w.locked && (
                  <Box sx={{ display: "flex" }}>
                    <IconButton
                      size="small"
                      disabled={idx === 0 || layout[idx - 1]?.locked}
                      onClick={() => onMoveWidget(w.id, "up")}
                      aria-label={labels.moveUp}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={idx === layout.length - 1}
                      onClick={() => onMoveWidget(w.id, "down")}
                      aria-label={labels.moveDown}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 1.5 }}>
            {labels.dragToReorder}
          </Typography>
        </Paper>
      </Collapse>
    </Box>
  );
}
