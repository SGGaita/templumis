"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import { BUDGET_CATEGORIES, calculateBudget, DEFAULT_FA_RATE } from "@/lib/grantLifecycle";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";

const emptyLine = () => ({ category: "materials", description: "", amount: 0, fte: 0.5, months: 12, monthly_rate: 0, quote_attached: false });

export default function GrantBudgetBuilder({ lines = [], unlocked = false, onChange, tuitionRemission = 0, faRate = DEFAULT_FA_RATE }) {
  const budget = calculateBudget(lines, tuitionRemission, faRate);

  const updateLine = (idx, patch) => {
    const next = lines.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onChange?.(next);
  };

  const addLine = () => onChange?.([...lines, emptyLine()]);
  const removeLine = (idx) => onChange?.(lines.filter((_, i) => i !== idx));

  return (
    <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700}>Research Budget Configurator</Typography>
        {!unlocked && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: ST.colors.warning }}>
            <LockIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={600}>Locked until sponsor confirms sponsorship</Typography>
          </Box>
        )}
      </Box>

      {!unlocked && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
          Link your faculty sponsor or advisor and wait for sponsorship confirmation before building the budget ledger.
        </Alert>
      )}

      <Table size="small" sx={{ mb: 2, opacity: unlocked ? 1 : 0.6, pointerEvents: unlocked ? "auto" : "none" }}>
        <TableHead>
          <TableRow sx={{ bgcolor: ST.colors.bg }}>
            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Amount (KES)</TableCell>
            <TableCell width={40} />
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3, color: ST.colors.textSecondary }}>
                No budget lines — add direct cost items below
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <TextField select size="small" value={line.category} onChange={(e) => updateLine(idx, { category: e.target.value })} sx={{ minWidth: 130 }}>
                    {BUDGET_CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField size="small" fullWidth value={line.description} onChange={(e) => updateLine(idx, { description: e.target.value })} placeholder="Line item" />
                </TableCell>
                <TableCell>
                  {line.category === "stipend" ? (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <TextField size="small" type="number" label="FTE" value={line.fte} onChange={(e) => updateLine(idx, { fte: e.target.value })} sx={{ width: 70 }} />
                      <TextField size="small" type="number" label="Mo" value={line.months} onChange={(e) => updateLine(idx, { months: e.target.value })} sx={{ width: 70 }} />
                      <TextField size="small" type="number" label="Rate/mo" value={line.monthly_rate} onChange={(e) => updateLine(idx, { monthly_rate: e.target.value })} sx={{ width: 90 }} />
                    </Box>
                  ) : (
                    <TextField size="small" type="number" value={line.amount} onChange={(e) => updateLine(idx, { amount: e.target.value })} sx={{ width: 120 }} />
                  )}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {budget.lines[idx] ? (line.category === "stipend"
                    ? (Number(line.fte) * Number(line.months) * Number(line.monthly_rate)).toLocaleString()
                    : Number(line.amount || 0).toLocaleString()) : "—"}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => removeLine(idx)} disabled={!unlocked}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Button startIcon={<AddIcon />} size="small" onClick={addLine} disabled={!unlocked} sx={{ mb: 2, textTransform: "none" }}>Add line item</Button>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: `${BRAND.navy}06`, borderRadius: 1.5 }}>
        <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>Indirect Cost (F&A) Calculator</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, fontSize: 13 }}>
          <Typography variant="body2">Total Direct Costs</Typography>
          <Typography variant="body2" fontWeight={700} align="right">KES {budget.total_direct.toLocaleString()}</Typography>
          <Typography variant="body2" color="text.secondary">Less Equipment + Tuition (MTDC base)</Typography>
          <Typography variant="body2" align="right">KES {budget.mtdc.toLocaleString()}</Typography>
          <Typography variant="body2" color="text.secondary">F&A @ {faRate}%</Typography>
          <Typography variant="body2" align="right">KES {Math.round(budget.indirect).toLocaleString()}</Typography>
          <Typography variant="body2" fontWeight={700}>Total Requested</Typography>
          <Typography variant="body2" fontWeight={800} align="right" sx={{ color: BRAND.teal }}>KES {Math.round(budget.total_requested).toLocaleString()}</Typography>
        </Box>
      </Paper>

      {budget.validation_errors?.length > 0 && (
        <Alert severity="error" sx={{ mt: 2, fontSize: 12 }}>
          {budget.validation_errors.join(" · ")}
        </Alert>
      )}
    </Paper>
  );
}
