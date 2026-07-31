"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Drawer,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { apiFetch } from "@/lib/api";
import { ST } from "@/lib/staffTheme";
import { parseCurrentYearSem } from "@/lib/studentJourney";

const RISK_COLORS = {
  critical: ST.colors.error,
  high: ST.colors.warning,
  medium: ST.colors.info,
  low: ST.colors.success,
};

function normalizeStage(journeyStage) {
  const s = String(journeyStage || "").toLowerCase();
  if (s.includes("pre") || s.includes("inquir") || s.includes("prospect")) return "pre";
  if (s.includes("enrol")) return "enrollment";
  if (s.includes("orient")) return "orientation";
  if (s.includes("graduat") || s.includes("clearance")) return "graduation";
  return "active";
}

const STAGE_LABEL = {
  pre: "Pre-enrollment",
  enrollment: "Enrollment",
  orientation: "Orientation",
  active: "Active learning",
  graduation: "Graduation",
};

function StaffSupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("student");

  const [journeys, setJourneys] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/student-journey/all-journeys");
        if (!cancelled) {
          setJourneys(data.journeys || []);
          setSummary({
            total: data.total_students,
            risk: data.risk_summary,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    return journeys.map((j) => {
      const gpa = j.academic_standing?.gpa ?? 0;
      const risk = j.risk_assessment?.risk_level || "low";
      const parsed = parseCurrentYearSem(j.current_year_sem);
      return {
        ...j,
        gpa,
        risk,
        stage: normalizeStage(j.journey_stage),
        yearLabel: parsed.year ? `Year ${parsed.year}` : j.current_year_sem,
        semLabel: parsed.semester ? `Sem ${parsed.semester}` : "",
      };
    });
  }, [journeys]);

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.student_id || "").toLowerCase().includes(q);
    const matchesRisk = riskFilter === "all" || r.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const selected = rows.find((r) => r.student_id === selectedId) || null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: ST.colors.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: ST.colors.text, mb: 0.5 }}>
        Student support
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2 }}>
        {summary?.total ?? filtered.length} students on the journey tracker — search, filter by risk, open a profile.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {summary?.risk && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {["critical", "high", "medium", "low"].map((level) => (
            <Chip
              key={level}
              size="small"
              label={`${level} · ${summary.risk[level] || 0}`}
              onClick={() => setRiskFilter(riskFilter === level ? "all" : level)}
              sx={{
                fontWeight: 600,
                textTransform: "capitalize",
                bgcolor: riskFilter === level ? `${RISK_COLORS[level]}22` : ST.colors.surface,
                color: riskFilter === level ? RISK_COLORS[level] : ST.colors.textSecondary,
                border: `1px solid ${riskFilter === level ? RISK_COLORS[level] : ST.colors.border}`,
              }}
            />
          ))}
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: `1px solid ${ST.colors.border}`,
          borderRadius: 2,
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Search by name or student ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: ST.colors.textMuted }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: ST.colors.surface }}>
              <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Programme</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Year / sem</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Risk</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                GPA
              </TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", color: ST.colors.textMuted }}>
                  No students match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.student_id}
                  hover
                  selected={r.student_id === selectedId}
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    router.push(`/staff/support?student=${encodeURIComponent(r.student_id)}`)
                  }
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.full_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: ST.colors.textMuted }}>
                      {r.student_id}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.programme_level}</TableCell>
                  <TableCell>
                    {r.yearLabel}
                    {r.semLabel ? ` · ${r.semLabel}` : ""}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.journey_stage}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.risk}
                      sx={{
                        fontWeight: 600,
                        textTransform: "capitalize",
                        bgcolor: `${RISK_COLORS[r.risk] || ST.colors.primary}18`,
                        color: RISK_COLORS[r.risk] || ST.colors.primary,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">{Number(r.gpa).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" sx={{ textTransform: "none", fontWeight: 600 }}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => router.push("/staff/support")}
        PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, p: 0 } }}
      >
        {selected && (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {selected.full_name}
                </Typography>
                <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                  {selected.student_id} · {selected.department}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => router.push("/staff/support")}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Chip
              label={`Risk: ${selected.risk}`}
              size="small"
              sx={{
                mb: 2,
                fontWeight: 700,
                bgcolor: `${RISK_COLORS[selected.risk]}22`,
                color: RISK_COLORS[selected.risk],
              }}
            />

            <Divider sx={{ mb: 2 }} />

            <List dense disablePadding>
              <ListItem disableGutters>
                <ListItemText primary="Programme" secondary={selected.programme_level} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Current period" secondary={selected.current_year_sem} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary="Academic standing"
                  secondary={`${selected.academic_standing?.standing || "—"} · GPA ${Number(selected.gpa).toFixed(2)}`}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary="Fees balance"
                  secondary={`KES ${Number(selected.financial_clearance?.fees_balance || 0).toLocaleString()}`}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Journey stage" secondary={selected.journey_stage} />
              </ListItem>
            </List>

            {(selected.risk_assessment?.interventions_needed?.length ?? 0) > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Suggested actions
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {selected.risk_assessment.interventions_needed.map((item) => (
                    <Chip key={item} label={item} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, textTransform: "none", fontWeight: 700 }}
              onClick={() => router.push("/staff/interventions")}
            >
              Go to interventions
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

export default function StaffSupportPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <StaffSupportContent />
    </Suspense>
  );
}
