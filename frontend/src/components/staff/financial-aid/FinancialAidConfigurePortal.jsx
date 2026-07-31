"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { canConfigureScholarships, canPublishScholarships } from "@/lib/staffPermissions";
import {
  RESIDENCY_FILTER_OPTIONS,
  INSTITUTION_COUNTRY_LABEL,
  residencyArrayToSelection,
  selectionToResidencyArray,
  residencySummary,
} from "@/lib/residency";

const VALUATION_TYPES = [
  { id: "fixed_sum", label: "Fixed amount (KES)" },
  { id: "percentage_tuition", label: "% of tuition" },
  { id: "full_ride", label: "Full ride" },
  { id: "last_dollar", label: "Gap-fill (last dollar)" },
];

const WORKFLOW_LABELS = {
  published: { label: "Published", color: "success" },
  pending_approval: { label: "Pending approval", color: "warning" },
  draft: { label: "Draft", color: "default" },
};

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const headSx = {
  fontWeight: 600,
  fontSize: 12,
  color: ST.colors.textSecondary,
  bgcolor: ST.colors.bg,
  borderBottom: `1px solid ${ST.colors.border}`,
  py: 1.5,
};

const emptyForm = (isGrant) => ({
  external_id: "",
  title: "",
  sponsoring_entity: isGrant ? "TemplumIS Research Office" : "TemplumIS Financial Aid",
  gl_code: isGrant ? "FA-GRANT" : "FA-SCHOL",
  program_type: isGrant ? "Research" : "Merit",
  criteria_text: "",
  value_kes: 0,
  coverage: "",
  slots_available: 0,
  budget_total_allocated: 0,
  valuation_type: "fixed_sum",
  valuation_config: { percent: 50, cap_kes: 75000 },
  eligibility_rules: {
    min_gpa: null,
    min_credits: 12,
    gpa_mode: "cumulative",
    majors: [],
    residency: [],
    gates: { good_standing: true, active_enrollment: true },
  },
  over_award_tolerance_pct: 105,
  min_gpa: null,
  requires_references: 0,
  academic_year: "2025/2026",
  open_to: "All",
  workflow_status: null,
});

const emptyLogicSimple = () => ({
  useAlternatePath: false,
  alternateMinGpa: 3.8,
  alternateMinCredits: 9,
});

function parseLogicSimple(logic, rules) {
  const simple = emptyLogicSimple();
  const children = logic?.children;
  if (Array.isArray(children) && children.length >= 2) {
    simple.useAlternatePath = true;
    const alt = children[1];
    if (alt?.rules?.includes("gpa_high")) simple.alternateMinGpa = rules?.alternate_min_gpa ?? 3.8;
    if (alt?.rules?.includes("credits_part")) simple.alternateMinCredits = rules?.alternate_min_credits ?? 9;
  }
  if (rules?.alternate_min_gpa != null) simple.alternateMinGpa = rules.alternate_min_gpa;
  if (rules?.alternate_min_credits != null) simple.alternateMinCredits = rules.alternate_min_credits;
  return simple;
}

function buildLogicExpression(simple, form, residencySel) {
  const minGpa = form.min_gpa ?? form.eligibility_rules?.min_gpa;
  const minCredits = form.eligibility_rules?.min_credits ?? 12;
  if (!simple.useAlternatePath) {
    return {
      mode: "all",
      summary: buildEligibilitySummary(form, simple, residencySel),
      rules: ["gpa_min", "credits_min", "major_match", "residency"],
    };
  }
  return {
    op: "or",
    summary: buildEligibilitySummary(form, simple, residencySel),
    children: [
      {
        op: "and",
        label: "Main path",
        rules: ["gpa_min", "credits_min"],
        description: `GPA ≥ ${minGpa ?? "—"} and credits ≥ ${minCredits}`,
      },
      {
        op: "and",
        label: "Alternate path",
        rules: ["gpa_high", "credits_part", "major_match"],
        description: `GPA ≥ ${simple.alternateMinGpa} and credits ≥ ${simple.alternateMinCredits}`,
      },
    ],
  };
}

function buildEligibilitySummary(form, simple, residencySel) {
  const parts = [];
  const gpa = form.min_gpa ?? form.eligibility_rules?.min_gpa;
  const credits = form.eligibility_rules?.min_credits;
  if (gpa != null && gpa !== "") parts.push(`GPA at least ${gpa}`);
  if (credits) parts.push(`at least ${credits} credits`);
  const majors = form.eligibility_rules?.majors || [];
  if (majors.length) parts.push(`programmes: ${majors.join(", ")}`);
  const resText = residencySummary(selectionToResidencyArray(residencySel));
  if (resText) parts.push(resText);
  if (form.eligibility_rules?.gates?.good_standing) parts.push("good academic standing");
  if (form.eligibility_rules?.gates?.active_enrollment) parts.push("actively enrolled");
  let text = parts.length ? parts.join(" · ") : "No minimum requirements set";
  if (simple.useAlternatePath) {
    text += ` — OR alternate path: GPA ≥ ${simple.alternateMinGpa}, ${simple.alternateMinCredits}+ credits`;
  }
  return text;
}

function Section({ title, hint, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          {hint}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export default function FinancialAidConfigurePortal({ programKind = "scholarship" }) {
  const router = useRouter();
  const isGrant = programKind === "grant";
  const label = isGrant ? "Grant" : "Scholarship";

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm(isGrant));
  const [logicSimple, setLogicSimple] = useState(emptyLogicSimple());
  const [majorsText, setMajorsText] = useState("");
  const [residencySelection, setResidencySelection] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [simulate, setSimulate] = useState(null);
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [wasPublished, setWasPublished] = useState(false);

  const programsApi = isGrant
    ? "/sis-lms/grants/programs?admin=1"
    : "/sis-lms/scholarships/programs?admin=1&kind=scholarship";

  const mayPublish = canPublishScholarships(user);

  const eligibilityPreview = useMemo(
    () => buildEligibilitySummary(form, logicSimple, residencySelection),
    [form, logicSimple, residencySelection]
  );

  useEffect(() => {
    apiFetch("/auth/me")
      .then((u) => {
        setUser(u);
        if (!canConfigureScholarships(u)) {
          setAccessDenied(true);
          router.replace(isGrant ? "/staff/grants/opportunities" : "/staff/scholarships/opportunities");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router, isGrant]);

  const loadPrograms = () => {
    setLoading(true);
    apiFetch(programsApi)
      .then((list) => setPrograms(Array.isArray(list) ? list : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, [programsApi]);

  const openNew = () => {
    setSelectedId(null);
    setForm(emptyForm(isGrant));
    setLogicSimple(emptyLogicSimple());
    setMajorsText("");
    setResidencySelection("");
    setWasPublished(false);
    setSimulate(null);
    setDrawerOpen(true);
  };

  const openEdit = (p) => {
    const rules = p.eligibility_rules || {};
    setSelectedId(p.id);
    setWasPublished(p.workflow_status === "published");
    setMajorsText((rules.majors || []).join(", "));
    setResidencySelection(residencyArrayToSelection(rules.residency));
    setLogicSimple(parseLogicSimple(p.logic_expression, rules));
    setForm({
      ...emptyForm(isGrant),
      external_id: p.id,
      title: p.scholarship_name,
      sponsoring_entity: p.sponsoring_entity || "",
      gl_code: p.gl_code || "",
      program_type: p.type,
      criteria_text: p.description || "",
      value_kes: p["amount_(kes)"],
      coverage: p.coverage || "",
      slots_available: p.slots,
      slots_filled: p.slots_filled ?? 0,
      budget_total_allocated: p.budget_total_allocated,
      valuation_type: p.valuation_type || "fixed_sum",
      valuation_config: p.valuation_config || {},
      eligibility_rules: { ...emptyForm(isGrant).eligibility_rules, ...rules },
      over_award_tolerance_pct: p.over_award_tolerance_pct ?? 100,
      min_gpa: p.min_gpa,
      requires_references: p.requires_references,
      academic_year: p.year,
      open_to: p.open_to,
      workflow_status: p.workflow_status,
      remaining_budget: p.remaining_budget,
    });
    setSimulate(null);
    setDrawerOpen(true);
  };

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateRules = (patch) =>
    setForm((f) => ({ ...f, eligibility_rules: { ...f.eligibility_rules, ...patch } }));

  const saveProgram = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const majors = majorsText.split(",").map((m) => m.trim()).filter(Boolean);
    const eligibility_rules = {
      ...form.eligibility_rules,
      majors,
      min_gpa: form.min_gpa,
      residency: selectionToResidencyArray(residencySelection),
      alternate_min_gpa: logicSimple.useAlternatePath ? logicSimple.alternateMinGpa : null,
      alternate_min_credits: logicSimple.useAlternatePath ? logicSimple.alternateMinCredits : null,
    };
    const payload = {
      ...form,
      eligibility_rules,
      logic_expression: buildLogicExpression(logicSimple, { ...form, eligibility_rules }, residencySelection),
      "amount_(kes)": form.value_kes,
      type: form.program_type,
      description: form.criteria_text,
      slots: form.slots_available,
      program_kind: programKind,
    };
    try {
      if (selectedId) {
        await apiFetch(`/sis-lms/scholarships/programs/${selectedId}`, { method: "PUT", body: payload });
        setMessage(
          wasPublished
            ? "Saved. This programme was live — it is now a draft and must be published again after review."
            : "Changes saved."
        );
      } else {
        const created = await apiFetch("/sis-lms/scholarships/programs", { method: "POST", body: payload });
        setSelectedId(created.id);
        setMessage("New draft created. Submit for review when ready.");
      }
      loadPrograms();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitReview = async () => {
    if (!selectedId) return;
    try {
      await apiFetch(`/sis-lms/scholarships/programs/${selectedId}/submit-review`, { method: "POST" });
      setMessage("Sent to director for approval.");
      setForm((f) => ({ ...f, workflow_status: "pending_approval" }));
      loadPrograms();
    } catch (e) {
      setError(e.message);
    }
  };

  const publish = async () => {
    if (!selectedId) return;
    try {
      await apiFetch(`/sis-lms/scholarships/programs/${selectedId}/publish`, { method: "POST" });
      setMessage("Published — students can apply now.");
      loadPrograms();
    } catch (e) {
      setError(e.message);
    }
  };

  const runSimulate = async () => {
    if (!selectedId) return;
    try {
      const res = await apiFetch(`/sis-lms/scholarships/programs/${selectedId}/simulate`, { method: "POST" });
      setSimulate(res);
    } catch (e) {
      setError(e.message);
    }
  };

  if (accessDenied) {
    return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(isGrant ? "/staff/grants/opportunities" : "/staff/scholarships/opportunities")}
        sx={{ mb: 2, textTransform: "none" }}
      >
        Back to opportunities
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Configure {label.toLowerCase()}s
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage programmes in the table below. Click Edit to update details and eligibility.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew} sx={{ textTransform: "none" }}>
          New {label.toLowerCase()}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {message && !drawerOpen && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message}</Alert>}

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>ID</TableCell>
                  <TableCell sx={headSx}>Name</TableCell>
                  <TableCell sx={headSx}>Type</TableCell>
                  <TableCell sx={headSx}>Award</TableCell>
                  <TableCell sx={headSx}>Slots</TableCell>
                  <TableCell sx={headSx}>Min GPA</TableCell>
                  <TableCell sx={headSx}>Status</TableCell>
                  <TableCell sx={headSx} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: ST.colors.textSecondary }}>
                      No programmes yet. Click &quot;New {label.toLowerCase()}&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  programs.map((p) => {
                    const wf = WORKFLOW_LABELS[p.workflow_status] || WORKFLOW_LABELS.draft;
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{p.id}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.scholarship_name}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.type}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{fmtKES(p["amount_(kes)"])}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {p.slots_filled ?? 0} / {p.slots ?? 0}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{p.min_gpa ?? "—"}</TableCell>
                        <TableCell>
                          <Chip label={wf.label} size="small" color={wf.color} sx={{ height: 22, fontSize: 11 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => openEdit(p)}
                            sx={{ textTransform: "none" }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 480, md: 560 }, p: 0 } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {selectedId ? `Edit ${selectedId}` : `New ${label.toLowerCase()}`}
              </Typography>
              {form.workflow_status && (
                <Chip
                  size="small"
                  label={WORKFLOW_LABELS[form.workflow_status]?.label || form.workflow_status}
                  color={WORKFLOW_LABELS[form.workflow_status]?.color || "default"}
                  sx={{ mt: 0.5, height: 20, fontSize: 10 }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
            {message && drawerOpen && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                {message}
              </Alert>
            )}

            <Section title="Basics" hint="What students see in the catalogue">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Programme name"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ID"
                    value={form.external_id}
                    onChange={(e) => update("external_id", e.target.value)}
                    disabled={!!selectedId}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Category"
                    value={form.program_type}
                    onChange={(e) => update("program_type", e.target.value)}
                  >
                    {(isGrant
                      ? ["Research", "Field Work", "Innovation"]
                      : ["Merit", "Merit + Need", "Need-Based", "Diversity", "Equity", "Research", "Leadership", "Sectoral"]
                    ).map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    label="Description for students"
                    value={form.criteria_text}
                    onChange={(e) => update("criteria_text", e.target.value)}
                  />
                </Grid>
              </Grid>
            </Section>

            <Section title="Funding" hint="Award amount and capacity">
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Award type"
                    value={form.valuation_type}
                    onChange={(e) => update("valuation_type", e.target.value)}
                  >
                    {VALUATION_TYPES.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Amount (KES)"
                    value={form.value_kes}
                    onChange={(e) => update("value_kes", Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Coverage"
                    value={form.coverage}
                    onChange={(e) => update("coverage", e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Slots available"
                    value={form.slots_available}
                    onChange={(e) => update("slots_available", Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Total budget (KES)"
                    value={form.budget_total_allocated}
                    onChange={(e) => update("budget_total_allocated", Number(e.target.value))}
                  />
                </Grid>
                {form.valuation_type === "percentage_tuition" && (
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Tuition %"
                      value={form.valuation_config?.percent ?? 50}
                      onChange={(e) =>
                        update("valuation_config", { ...form.valuation_config, percent: Number(e.target.value) })
                      }
                    />
                  </Grid>
                )}
              </Grid>
            </Section>

            <Section title="Who can apply?" hint="Set requirements — preview updates as you type">
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ step: 0.01, min: 0, max: 4 }}
                    label="Minimum GPA"
                    value={form.min_gpa ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : null;
                      update("min_gpa", v);
                      updateRules({ min_gpa: v });
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Minimum credits"
                    value={form.eligibility_rules?.min_credits ?? 12}
                    onChange={(e) => updateRules({ min_credits: Number(e.target.value) })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Programmes / majors (comma-separated, leave empty for all)"
                    value={majorsText}
                    onChange={(e) => setMajorsText(e.target.value)}
                    placeholder="e.g. Computer Science, Law, Nursing"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" fontWeight={600} sx={{ display: "block", mb: 0.5 }}>
                    Nationality / residency
                  </Typography>
                  <RadioGroup
                    value={residencySelection}
                    onChange={(e) => setResidencySelection(e.target.value)}
                  >
                    {RESIDENCY_FILTER_OPTIONS.map((opt) => (
                      <FormControlLabel
                        key={opt.id || "all"}
                        value={opt.id}
                        control={<Radio size="small" />}
                        label={
                          <Box>
                            <Typography variant="body2">{opt.label}</Typography>
                            {opt.description && (
                              <Typography variant="caption" color="text.secondary">
                                {opt.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ alignItems: "flex-start", mb: 0.5 }}
                      />
                    ))}
                  </RadioGroup>
                </Grid>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.eligibility_rules?.gates?.good_standing !== false}
                          onChange={(e) =>
                            updateRules({ gates: { ...form.eligibility_rules?.gates, good_standing: e.target.checked } })
                          }
                        />
                      }
                      label="Must be in good academic standing"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.eligibility_rules?.gates?.active_enrollment !== false}
                          onChange={(e) =>
                            updateRules({ gates: { ...form.eligibility_rules?.gates, active_enrollment: e.target.checked } })
                          }
                        />
                      }
                      label="Must be actively enrolled"
                    />
                  </FormGroup>
                </Grid>
              </Grid>

              <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: ST.colors.bg }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={logicSimple.useAlternatePath}
                      onChange={(e) => setLogicSimple((s) => ({ ...s, useAlternatePath: e.target.checked }))}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={600}>
                      Also allow an alternate path (OR)
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Off = student must meet every requirement above. On = student can qualify via a second, stricter path
                  (e.g. higher GPA with fewer credits).
                </Typography>
                {logicSimple.useAlternatePath && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ step: 0.01 }}
                        label="Alternate min GPA"
                        value={logicSimple.alternateMinGpa}
                        onChange={(e) =>
                          setLogicSimple((s) => ({ ...s, alternateMinGpa: Number(e.target.value) }))
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Alternate min credits"
                        value={logicSimple.alternateMinCredits}
                        onChange={(e) =>
                          setLogicSimple((s) => ({ ...s, alternateMinCredits: Number(e.target.value) }))
                        }
                      />
                    </Grid>
                  </Grid>
                )}
                <Alert severity="info" icon={false} sx={{ mt: 2, py: 0.5 }}>
                  <Typography variant="caption">
                    <strong>Preview:</strong> {eligibilityPreview}
                  </Typography>
                </Alert>
              </Paper>
            </Section>

            <Section title="Workflow">
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.requires_references}
                    onChange={(e) => update("requires_references", e.target.checked ? 1 : 0)}
                  />
                }
                label="Requires reference letters"
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={runSimulate}
                  disabled={!selectedId}
                  sx={{ textTransform: "none" }}
                >
                  Test eligibility
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={submitReview}
                  disabled={!selectedId}
                  sx={{ textTransform: "none" }}
                >
                  Submit for approval
                </Button>
                {mayPublish && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={publish}
                    disabled={!selectedId}
                    sx={{ textTransform: "none" }}
                  >
                    Publish
                  </Button>
                )}
              </Box>
              {simulate && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  About <strong>{simulate.eligible_count}</strong> students currently match (
                  {simulate.total_students} in registry).
                </Alert>
              )}
            </Section>
          </Box>

          <Box sx={{ p: 2, borderTop: `1px solid ${ST.colors.border}`, display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={() => setDrawerOpen(false)} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveProgram}
              disabled={saving || !form.title}
              sx={{ textTransform: "none" }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
