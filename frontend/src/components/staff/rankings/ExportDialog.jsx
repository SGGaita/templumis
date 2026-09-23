"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { ST } from "@/lib/staffTheme";
import { EXPORT_SECTIONS } from "@/lib/rankings/executive";
import { FrameworkChecklist } from "./FrameworkPicker";
import { MutedNote } from "./ui";

export const DEFAULT_EXPORT = {
  sections: EXPORT_SECTIONS.map((s) => s.id),
  indicatorTables: false,
  priorityLimit: 10,
};

const OPTION_LABEL_SX = { fontWeight: 600 };

/**
 * Lets the user choose what goes into the PDF before printing.
 * onExport receives { sections, frameworks, indicatorTables, priorityLimit }.
 */
export default function ExportDialog({ open, onClose, onExport, available, selected }) {
  const [sections, setSections] = useState(DEFAULT_EXPORT.sections);
  const [frameworks, setFrameworks] = useState(selected);
  const [indicatorTables, setIndicatorTables] = useState(DEFAULT_EXPORT.indicatorTables);
  const [priorityLimit, setPriorityLimit] = useState(DEFAULT_EXPORT.priorityLimit);

  // Each time the dialog opens, start from the frameworks currently on screen.
  useEffect(() => {
    if (open) setFrameworks(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleSection = (id) =>
    setSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : EXPORT_SECTIONS.map((s) => s.id).filter((x) => x === id || prev.includes(x))
    );

  const canExport = sections.length > 0 && frameworks.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="no-print">
      <DialogTitle sx={{ fontWeight: 700 }}>Export University Rankings Summary</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={OPTION_LABEL_SX}>
              Sections
            </Typography>
            <MutedNote sx={{ mb: 1 }}>Choose what appears in the document.</MutedNote>
            {EXPORT_SECTIONS.map((s) => (
              <Box key={s.id} sx={{ mb: 1 }}>
                <FormControlLabel
                  sx={{ alignItems: "flex-start", ml: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={sections.includes(s.id)}
                      onChange={() => toggleSection(s.id)}
                      sx={{ mt: -0.5 }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {s.label}
                      </Typography>
                      <MutedNote>{s.description}</MutedNote>
                    </Box>
                  }
                />
                {s.id === "detail" && sections.includes("detail") && (
                  <FormControlLabel
                    sx={{ ml: 4.5, mt: 0.5 }}
                    control={
                      <Switch
                        size="small"
                        checked={indicatorTables}
                        onChange={(e) => setIndicatorTables(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">Include full indicator tables</Typography>}
                  />
                )}
                {s.id === "priorities" && sections.includes("priorities") && (
                  <TextField
                    select
                    size="small"
                    label="Rows"
                    value={priorityLimit ?? "all"}
                    onChange={(e) => setPriorityLimit(e.target.value === "all" ? null : Number(e.target.value))}
                    sx={{ ml: 4.5, mt: 1, width: 160 }}
                  >
                    <MenuItem value={10}>Top 10</MenuItem>
                    <MenuItem value={25}>Top 25</MenuItem>
                    <MenuItem value="all">All gaps</MenuItem>
                  </TextField>
                )}
              </Box>
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={OPTION_LABEL_SX}>
              Frameworks
            </Typography>
            <MutedNote sx={{ mb: 1 }}>Defaults to the frameworks on screen.</MutedNote>
            <Box sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 1.5, px: 1.5, py: 1 }}>
              <FrameworkChecklist available={available} selected={frameworks} onChange={setFrameworks} dense />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, justifyContent: "space-between" }}>
        <MutedNote>In the print dialog, choose &quot;Save as PDF&quot; as the destination.</MutedNote>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintOutlinedIcon />}
            disabled={!canExport}
            onClick={() => onExport({ sections, frameworks, indicatorTables, priorityLimit })}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Print / Save as PDF
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
