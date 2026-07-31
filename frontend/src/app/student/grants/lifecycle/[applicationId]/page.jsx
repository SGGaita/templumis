"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import GrantLifecycleSidebar from "@/components/grants/GrantLifecycleSidebar";
import GrantStepPreview from "@/components/grants/GrantStepPreview";
import GrantApplicationWorkspace from "@/components/grants/GrantApplicationWorkspace";
import {
  ROUTING_LABELS,
  stageLabel,
  peerReviewComposite,
  getWorkflowStages,
  resolveViewStep,
} from "@/lib/grantLifecycle";

/* ── Step content panels ── */

/* PI Grant — delegate interactive steps to workspace */
function PIInteractiveStep({ app, onUpdate, stepIndex }) {
  return (
    <GrantApplicationWorkspace
      grantId={app?.grant_id}
      showHeader={false}
      showStepper={false}
      forcedViewStep={stepIndex}
      onAppChange={onUpdate}
    />
  );
}

function PIReviewStep({ app }) {
  const lc = app?.lifecycle || {};
  const peer = lc.peer_review || {};
  const routing = lc.routing || {};

  return (
    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 2 }}>Review Status</Typography>
      <Stack spacing={1.5}>
        {/* Routing */}
        <Box>
          <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            Institutional Sign-Off
          </Typography>
          {(routing.steps || []).length > 0 ? routing.steps.map((step) => (
            <Box key={step.role} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.875, borderBottom: `1px solid ${ST.colors.border}` }}>
              <Typography variant="body2">{step.label || ROUTING_LABELS[step.role]}</Typography>
              <Chip size="small" label={step.status}
                sx={{ bgcolor: step.status === "approved" ? ST.colors.successLight : step.status === "returned" ? ST.colors.errorLight : ST.colors.warningLight,
                  color: step.status === "approved" ? ST.colors.success : step.status === "returned" ? ST.colors.error : ST.colors.warning,
                  fontWeight: 700, height: 20, fontSize: 11 }} />
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary">Routing is pending submission of your proposal.</Typography>
          )}
          {routing.return_comments && <Alert severity="warning" sx={{ mt: 1.5 }}>{routing.return_comments}</Alert>}
        </Box>
        <Divider />
        {/* Peer review */}
        <Box>
          <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
            Peer Review Panel
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {peer.status === "complete" ? "Review complete." : "Reviewers are evaluating intellectual merit, impact, feasibility, and budget realism."}
          </Typography>
          {peer.scores && Object.keys(peer.scores).length > 0 && (
            <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5, display: "inline-block" }}>
              <Typography variant="caption" color="text.secondary">Composite score</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: BRAND.navy }}>
                {(peer.composite ?? peerReviewComposite(peer.scores)).toFixed(2)} <Typography component="span" variant="body2" color="text.secondary">/ 5</Typography>
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

/* University Grant steps */
function UniApplicationStep({ app, applicationId, onUpdate }) {
  return (
    <GrantApplicationWorkspace
      grantId={app?.grant_id}
      showHeader={false}
      showStepper={false}
      onAppChange={onUpdate}
    />
  );
}

function UniComplianceStep({ app }) {
  const lc = app?.lifecycle || {};
  const routing = lc.routing || {};
  return (
    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 2 }}>Compliance & Institutional Review</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The grants office is checking your application for ethics, compliance, and institutional routing requirements. No action is required from you unless flagged.
      </Typography>
      {(routing.steps || []).length > 0 ? (
        routing.steps.map((step) => (
          <Box key={step.role} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.875, borderBottom: `1px solid ${ST.colors.border}` }}>
            <Typography variant="body2">{step.label || ROUTING_LABELS[step.role]}</Typography>
            <Chip size="small" label={step.status}
              sx={{ bgcolor: step.status === "approved" ? ST.colors.successLight : step.status === "returned" ? ST.colors.errorLight : ST.colors.warningLight,
                color: step.status === "approved" ? ST.colors.success : step.status === "returned" ? ST.colors.error : ST.colors.warning,
                fontWeight: 700, height: 20, fontSize: 11 }} />
          </Box>
        ))
      ) : (
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>Your application is queued for compliance review. You will be notified if any clarification is needed.</Alert>
      )}
      {routing.return_comments && <Alert severity="warning" sx={{ mt: 2 }}>{routing.return_comments}</Alert>}
    </Paper>
  );
}

function UniDecisionStep({ app }) {
  const lc = app?.lifecycle || {};
  const peer = lc.peer_review || {};
  const status = String(app?.status || "").toLowerCase();
  const approved = status === "approved" || status === "awarded";
  const rejected = status === "rejected";

  return (
    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 2 }}>Award Decision</Typography>
      {approved ? (
        <Alert severity="success" sx={{ borderRadius: 1.5, mb: 2 }}>Your application has been <strong>approved</strong>. Proceed to Step 4 — Active Grant to begin tracking.</Alert>
      ) : rejected ? (
        <Alert severity="error" sx={{ borderRadius: 1.5, mb: 2 }}>Your application was not selected in this cycle. Check with the grants office for feedback.</Alert>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 1.5, mb: 2 }}>The awards committee is reviewing applications. Decisions are communicated via email and reflected here.</Alert>
      )}
      {peer.scores && Object.keys(peer.scores).length > 0 && (
        <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5, display: "inline-block" }}>
          <Typography variant="caption" color="text.secondary">Review score</Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: BRAND.navy }}>
            {(peer.composite ?? peerReviewComposite(peer.scores)).toFixed(2)} <Typography component="span" variant="body2" color="text.secondary">/ 5</Typography>
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

/* Shared Active Grant step */
function ActiveGrantStep({ app, applicationId, onUpdate }) {
  const lc = app?.lifecycle || {};
  const post = lc.post_award || {};
  const close = lc.closeout || {};
  const [procDesc, setProcDesc] = useState("");
  const [procAmount, setProcAmount] = useState("");
  const [procCategory, setProcCategory] = useState("materials");
  const [effortPct, setEffortPct] = useState("50");
  const [error, setError] = useState("");

  const requestProcurement = async () => {
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${applicationId}/procurement`, {
        method: "POST",
        body: { description: procDesc, amount: Number(procAmount), category: procCategory },
      });
      if (onUpdate) onUpdate(res.application);
      setProcDesc(""); setProcAmount("");
      setError("");
    } catch (e) { setError(e.message); }
  };

  const submitEffort = async () => {
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${applicationId}/effort-report`, {
        method: "POST",
        body: { effort_pct: Number(effortPct), student_signed: true, period: new Date().toISOString().slice(0, 7) },
      });
      if (onUpdate) onUpdate(res.application);
      setError("");
    } catch (e) { setError(e.message); }
  };

  if (!post.wbs_code) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1.5 }}>
        Award approved — the Financial Aid Office is setting up your restricted research ledger (WBS code). This usually takes 2–3 working days.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert>}

      {/* Ledger summary */}
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 2 }}>Research Ledger</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 2 }}>
          {[
            { label: "WBS Code", value: post.wbs_code },
            { label: "Award Ceiling", value: `KES ${Number(post.award_amount || 0).toLocaleString()}` },
            { label: "Status", value: "Active", color: ST.colors.success },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>{label}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: color || BRAND.navy }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        {Object.keys(post.category_balances || {}).length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Budget Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Balance (KES)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(post.category_balances).map(([cat, bal]) => (
                <TableRow key={cat}>
                  <TableCell sx={{ fontSize: 12 }}>{cat}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12 }}>{Number(bal).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Procurement */}
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 2 }}>Request Procurement</Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-end" }}>
          <TextField size="small" label="Description" value={procDesc} onChange={(e) => setProcDesc(e.target.value)} sx={{ flex: 2, minWidth: 180 }} />
          <TextField size="small" type="number" label="Amount (KES)" value={procAmount} onChange={(e) => setProcAmount(e.target.value)} sx={{ width: 140 }} />
          <TextField size="small" label="Category" value={procCategory} onChange={(e) => setProcCategory(e.target.value)} sx={{ width: 140 }} />
          <Button variant="contained" size="small" onClick={requestProcurement} disabled={!procDesc || !procAmount}
            sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            Submit
          </Button>
        </Box>
      </Paper>

      {/* Milestones & effort */}
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 2 }}>Milestones & Effort Reporting</Typography>
        {(close.milestones || []).length > 0 ? (
          <Box sx={{ mb: 2 }}>
            {close.milestones.map((m) => (
              <Box key={m.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.875, borderBottom: `1px solid ${ST.colors.border}` }}>
                <Typography variant="body2">{m.label}</Typography>
                <Chip size="small" label={m.status} sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No milestones configured yet.</Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>Bi-annual Effort Certification</Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <TextField size="small" type="number" label="% effort" value={effortPct} onChange={(e) => setEffortPct(e.target.value)} sx={{ width: 100 }} />
          <Button size="small" variant="outlined" onClick={submitEffort}
            sx={{ textTransform: "none", fontWeight: 600, borderColor: BRAND.navy, color: BRAND.navy, borderRadius: 1.5 }}>
            Certify effort
          </Button>
        </Box>
        {(close.effort_reports || []).length > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {close.effort_reports.length} effort report(s) on file
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}

/* ══ Main lifecycle page ══ */
export default function GrantLifecyclePage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.applicationId;

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [error, setError] = useState("");
  const [viewStep, setViewStep] = useState(null); // null = auto from real stage

  const reload = () =>
    apiFetch("/sis-lms/grants/applications/my")
      .then((res) => {
        const found = (res.applications || []).find((a) => String(a.id) === String(applicationId));
        if (!found) throw new Error("Application not found");
        setApp(found);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;
  }
  if (!app) return <Alert severity="error">{error || "Application not found"}</Alert>;

  const stageKey = app?.lifecycle_stage || "proposal_budget";
  const lifecycle = app?.lifecycle || {};
  // Detect category from grant details or mock PI id prefix
  const grantId = String(app?.grant_id || "");
  const grantCategory = grantId.startsWith("pi-") ? "pi" : "university";
  const stages = getWorkflowStages(grantCategory);
  const realStepIdx = resolveViewStep(grantCategory, stageKey, lifecycle, stages);
  const activeStep = viewStep !== null ? viewStep : realStepIdx;
  const currentStageConfig = stages[activeStep];
  const progressStageConfig = stages[realStepIdx];
  const isAhead = activeStep > realStepIdx;
  const isReadOnly = currentStageConfig?.readOnly && !isAhead;

  /* Category badge */
  const CatIcon = grantCategory === "pi" ? GroupsIcon : AccountBalanceIcon;
  const catLabel = grantCategory === "pi" ? "PI Grant" : "University Grant";
  const catColor = grantCategory === "pi" ? "#7c3aed" : BRAND.teal;
  const catBg = grantCategory === "pi" ? "#f5f3ff" : `${BRAND.teal}12`;

  /* Render step content */
  const renderStepContent = () => {
    if (grantCategory === "pi") {
      switch (currentStageConfig?.key) {
        case "project_brief":
        case "apply":
          return <PIInteractiveStep app={app} onUpdate={setApp} stepIndex={activeStep} />;
        case "compliance_review":
          return <PIInteractiveStep app={app} onUpdate={setApp} stepIndex={activeStep} />;
        case "offer_acceptance":
          return <PIInteractiveStep app={app} onUpdate={setApp} stepIndex={activeStep} />;
        case "active_work":
          return (
            <GrantStepPreview locked={isAhead}>
              <ActiveGrantStep app={app} applicationId={applicationId} onUpdate={setApp} />
            </GrantStepPreview>
          );
        default:
          return null;
      }
    } else {
      const content = (() => {
        switch (currentStageConfig?.key) {
          case "application": return <UniApplicationStep app={app} applicationId={applicationId} onUpdate={setApp} />;
          case "compliance":  return <UniComplianceStep app={app} />;
          case "decision":    return <UniDecisionStep app={app} />;
          case "active":      return <ActiveGrantStep app={app} applicationId={applicationId} onUpdate={setApp} />;
          default:            return null;
        }
      })();
      return <GrantStepPreview locked={isAhead}>{content}</GrantStepPreview>;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Back */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/student/grants")}
        sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary }}>
        My grants
      </Button>

      {/* Header */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${catColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CatIcon sx={{ color: catColor, fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
              <Chip size="small" label={catLabel}
                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: catBg, color: catColor }} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
                {app.application_id}
              </Typography>
            </Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>
              {app.project_title || app.grant_details?.scholarship_name || "Grant Application"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {app.grant_details?.scholarship_name}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", fontSize: 10 }}>Current stage</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: BRAND.teal }}>
              {progressStageConfig?.label || stageLabel(stageKey)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Sidebar + content */}
      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexDirection: { xs: "column", md: "row" } }}>
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 240 },
            flexShrink: 0,
            p: 2,
            border: `1px solid ${ST.colors.border}`,
            borderRadius: 2.5,
            position: { md: "sticky" },
            top: { md: 16 },
          }}
        >
          <GrantLifecycleSidebar
            stages={stages}
            currentStage={stageKey}
            progressStep={realStepIdx}
            viewStep={activeStep}
            onStepClick={(i) => setViewStep(i)}
            accentColor={grantCategory === "pi" ? "#7c3aed" : BRAND.navy}
          />
        </Paper>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
          {renderStepContent()}
        </Box>
      </Box>
    </Box>
  );
}
