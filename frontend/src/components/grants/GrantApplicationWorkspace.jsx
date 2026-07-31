"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import GrantLifecycleSidebar from "@/components/grants/GrantLifecycleSidebar";
import GrantStepPreview from "@/components/grants/GrantStepPreview";
import GrantBudgetBuilder from "@/components/grants/GrantBudgetBuilder";
import GrantProposalDocumentsUpload from "@/components/grants/GrantProposalDocumentsUpload";
import {
  stageLabel,
  getWorkflowStages,
  resolveViewStep,
  isPiApplicationSubmitted,
  isPiEndorsed,
} from "@/lib/grantLifecycle";
import PiProjectBrief from "@/components/grants/PiProjectBrief";
import {
  PiApplyPanel,
  PiComplianceReviewPanel,
  PiOfferPanel,
  PiActiveWorkPanel,
} from "@/components/grants/PiGrantWorkflow";

export default function GrantApplicationWorkspace({
  grantId,
  backHref = "/student/grants/opportunities",
  backLabel = "Back to opportunities",
  showHeader = true,
  showStepper = true,
  onAppChange,
  forcedViewStep,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [grant, setGrant] = useState(null);
  const [app, setApp] = useState(null);
  const [viewStep, setViewStep] = useState(null); // null = auto from real stage

  // Form state
  const [projectTitle, setProjectTitle] = useState("");
  const [documents, setDocuments] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [piName, setPiName] = useState("");
  const [piEmail, setPiEmail] = useState("");
  const [fitStatement, setFitStatement] = useState("");
  const [candidate, setCandidate] = useState({ enrolled: true, offer_accepted: false, concurrent_admission: false, cover_letter: "", publications_summary: "", documents: [] });
  const [applicationPath, setApplicationPath] = useState("self_apply");
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [budgetLines, setBudgetLines] = useState([]);
  const [humanSubjects, setHumanSubjects] = useState(false);
  const [animalSubjects, setAnimalSubjects] = useState(false);
  const [recombinantDna, setRecombinantDna] = useState(false);
  const [irbProtocol, setIrbProtocol] = useState("");
  const [iacucProtocol, setIacucProtocol] = useState("");
  const [ibcProtocol, setIbcProtocol] = useState("");
  const [coiStudent, setCoiStudent] = useState(false);
  const [coiPi, setCoiPi] = useState(false);

  const lifecycle = app?.lifecycle || {};
  const stageKey = app?.lifecycle_stage || lifecycle?.stage_key || "proposal_budget";
  const piConfirmed = lifecycle?.proposal?.pi_confirmed;
  const piEndorsed = isPiEndorsed(lifecycle);
  const recruitment = lifecycle?.recruitment || {};
  const piInvitePending = Boolean(recruitment.pi_invite_pending);
  const budgetUnlocked = lifecycle?.budget?.budget_unlocked || piConfirmed;
  const grantCategory = String(grantId || "").startsWith("pi-") ? "pi" : "university";
  const stages = getWorkflowStages(grantCategory);
  const realStepIdx = resolveViewStep(grantCategory, stageKey, lifecycle, stages);
  const activeStep = viewStep !== null ? viewStep : realStepIdx;
  const currentStageConfig = stages[activeStep];
  const isAhead = activeStep > realStepIdx;
  const applicationSubmitted = grantCategory === "pi" && isPiApplicationSubmitted(lifecycle);

  const syncApp = useCallback((next) => {
    setApp(next);
    onAppChange?.(next);
  }, [onAppChange]);

  const hydrate = useCallback((res, journey) => {
    setGrant(res.grant);
    const a = res.application;
    syncApp(a);
    const lc = a?.lifecycle || {};
    const prop = lc.proposal || {};
    const comp = lc.compliance || {};
    const g = res.grant || {};
    setProjectTitle(a?.project_title || journey?.pg_research?.dissertation_title || "");
    setDocuments(prop.documents || []);
    setKeywords((prop.keywords || []).join(", "));
    setPiName(prop.pi_name || journey?.pg_research?.supervisor || g.pi_name || "");
    setPiEmail(prop.pi_email || "");
    setFitStatement(prop.fit_statement || "");
    const cand = lc.candidate || {};
    setCandidate({
      enrolled: cand.enrolled !== false,
      offer_accepted: Boolean(cand.offer_accepted),
      concurrent_admission: Boolean(cand.concurrent_admission),
      cover_letter: cand.cover_letter || "",
      publications_summary: cand.publications_summary || "",
      documents: cand.documents || [],
    });
    const rec = lc.recruitment || {};
    setApplicationPath(rec.application_path || (rec.pi_invite_pending ? "pi_invite" : "self_apply"));
    setBudgetLines(lc.budget?.lines || []);
    setHumanSubjects(comp.human_subjects || false);
    setAnimalSubjects(comp.animal_subjects || false);
    setRecombinantDna(comp.recombinant_dna || false);
    setIrbProtocol(comp.irb_protocol || "");
    setIacucProtocol(comp.iacuc_protocol || "");
    setIbcProtocol(comp.ibc_protocol || "");
    setCoiStudent(comp.coi_student_signed || false);
    setCoiPi(comp.coi_pi_signed || false);
  }, [syncApp]);

  const reload = useCallback(() => {
    return Promise.all([
      apiFetch(`/sis-lms/grants/applications/student/${encodeURIComponent(grantId)}`),
      apiFetch("/student-journey/my-journey-excel").catch(() => null),
    ]).then(([res, j]) => hydrate(res, j));
  }, [grantId, hydrate]);

  useEffect(() => {
    if (forcedViewStep !== undefined && forcedViewStep !== null) {
      setViewStep(forcedViewStep);
    }
  }, [forcedViewStep]);

  useEffect(() => {
    if (!grantId) return;
    reload().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [reload, grantId]);

  /* ── Actions ── */
  const saveDraft = async () => {
    setSaving(true); setError("");
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/draft`, {
        method: "PATCH",
        body: {
          project_title: projectTitle,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          pi_name: piName, pi_email: piEmail, fit_statement: fitStatement,
          proposal: { documents, keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean), pi_name: piName, pi_email: piEmail, fit_statement: fitStatement },
          budget_lines: budgetLines,
        },
      });
      syncApp(res.application);
      setDocuments(res.application?.lifecycle?.proposal?.documents || documents);
      setSuccess("Draft saved");
      setTimeout(() => setSuccess(""), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const submitProposal = async () => {
    setSubmitting(true); setError("");
    try {
      await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/draft`, {
        method: "PATCH",
        body: { project_title: projectTitle, keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean), pi_name: piName, pi_email: piEmail, fit_statement: fitStatement, proposal: { documents, pi_name: piName, pi_email: piEmail, fit_statement: fitStatement }, budget_lines: budgetLines },
      });
      const res = await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/submit`, { method: "POST" });
      syncApp(res.application);
      setSuccess(res.message);
      if (res.application?.id) setTimeout(() => router.push(`/student/grants/lifecycle/${res.application.id}`), 800);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const [acknowledging, setAcknowledging] = useState(false);

  const buildCandidatePayload = () => ({
    cover_letter: candidate.cover_letter,
    publications_summary: candidate.publications_summary,
    enrolled: candidate.enrolled,
    concurrent_admission: candidate.concurrent_admission,
    offer_accepted: candidate.offer_accepted,
    documents: candidate.documents,
  });

  const acknowledgeBrief = async () => {
    setAcknowledging(true);
    setError("");
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/acknowledge-brief`, { method: "POST" });
      syncApp(res.application);
      setSuccess(res.message);
      setViewStep(1);
    } catch (e) { setError(e.message); }
    finally { setAcknowledging(false); }
  };

  const saveCandidateDraft = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/draft`, {
        method: "PATCH",
        body: {
          project_title: projectTitle,
          candidate: buildCandidatePayload(),
          recruitment: { application_path: applicationPath },
        },
      });
      syncApp(res.application);
      const cand = res.application?.lifecycle?.candidate || {};
      setCandidate((c) => ({ ...c, documents: cand.documents || c.documents }));
      setSuccess("Draft saved");
      setTimeout(() => setSuccess(""), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const submitPiApplication = async () => {
    setSubmitting(true); setError("");
    try {
      await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/draft`, {
        method: "PATCH",
        body: {
          project_title: projectTitle,
          candidate: buildCandidatePayload(),
          recruitment: { application_path: applicationPath },
        },
      });
      const res = await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/apply`, { method: "POST" });
      syncApp(res.application);
      setSuccess(res.message);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const acceptPiInvite = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${encodeURIComponent(grantId)}/accept-invite`, { method: "POST" });
      syncApp(res.application);
      setSuccess(res.message);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const acceptOffer = async () => {
    if (!app?.id) return;
    setAcceptingOffer(true);
    setError("");
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${app.id}/offer/accept`, { method: "POST" });
      syncApp(res.application);
      setSuccess(res.message);
    } catch (e) { setError(e.message); }
    finally { setAcceptingOffer(false); }
  };

  const handleCandidateUploadSync = (application) => {
    if (!application) return;
    syncApp(application);
    const docs = application?.lifecycle?.candidate?.documents || [];
    setCandidate((c) => ({ ...c, documents: docs }));
  };

  const saveCompliance = async () => {
    if (!app?.id) return;
    setSaving(true); setError("");
    try {
      const res = await apiFetch(`/sis-lms/grants/applications/${app.id}/compliance`, {
        method: "PATCH",
        body: { human_subjects: humanSubjects, animal_subjects: animalSubjects, recombinant_dna: recombinantDna, irb_protocol: irbProtocol, iacuc_protocol: iacucProtocol, ibc_protocol: ibcProtocol, coi_student_signed: coiStudent, coi_pi_signed: coiPi },
      });
      syncApp(res.application);
      setSuccess("Compliance updated");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const submitCompliance = async () => {
    if (!app?.id) return;
    setSubmitting(true); setError("");
    try {
      await apiFetch(`/sis-lms/grants/applications/${app.id}/compliance`, {
        method: "PATCH",
        body: { human_subjects: humanSubjects, animal_subjects: animalSubjects, recombinant_dna: recombinantDna, irb_protocol: irbProtocol, iacuc_protocol: iacucProtocol, ibc_protocol: ibcProtocol, coi_student_signed: coiStudent, coi_pi_signed: coiPi },
      });
      const res = await apiFetch(`/sis-lms/grants/applications/${app.id}/compliance/submit`, { method: "POST" });
      syncApp(res.application);
      setSuccess(res.message);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleUploadSync = (application) => {
    if (application) { syncApp(application); setDocuments(application?.lifecycle?.proposal?.documents || []); }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>;

  /* ── Step content panels (plain render helpers — not nested components, so inputs keep focus) ── */

  const renderProposalPanel = () => (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Research Proposal Workspace</Typography>
          <TextField fullWidth required label="Project title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} sx={{ mb: 3 }} />
          <GrantProposalDocumentsUpload grantId={grantId} documents={documents} onChange={setDocuments} onUploaded={handleUploadSync} />
          <TextField fullWidth label="Subject matter keywords (comma-separated)" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Nanotechnology, genomics" sx={{ mt: 3, mb: 2 }} />
          <Divider sx={{ my: 2 }} />
          {grantCategory !== "pi" && (
            <>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Sponsor / Advisor linking</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Sponsor / advisor name" value={piName} onChange={(e) => setPiName(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Sponsor / advisor email" type="email" value={piEmail} onChange={(e) => setPiEmail(e.target.value)} />
                </Grid>
              </Grid>
            </>
          )}
          {grantCategory === "pi" && piName && (
            <Alert severity="success" sx={{ mb: 1.5, fontSize: 13 }}>
              Sponsoring PI: <strong>{piName}</strong>
              {piEndorsed ? " — endorsed your application." : applicationSubmitted ? " — awaiting endorsement." : ""}
            </Alert>
          )}
          {grantCategory !== "pi" && (
            piConfirmed
              ? <Chip label="Sponsorship confirmed — budget unlocked" color="success" size="small" sx={{ mt: 1.5, fontWeight: 600 }} />
              : <Alert severity="info" sx={{ mt: 1.5, fontSize: 13 }}>Your sponsor or advisor will be notified to confirm sponsorship. The budget builder unlocks after confirmation.</Alert>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <GrantBudgetBuilder lines={budgetLines} unlocked={budgetUnlocked} onChange={setBudgetLines} faRate={lifecycle?.budget?.fa_rate_pct} />
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={saveDraft} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}>Save draft</Button>
          <Button variant="contained" startIcon={<SendIcon />} disabled={submitting} onClick={submitProposal}
            sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            {grantCategory === "pi" ? "Submit proposal → Review" : "Submit proposal → Compliance"}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderPIBriefPanel = () => (
    <Stack spacing={2.5}>
      <PiProjectBrief grant={grant} />
      <Alert severity="info" sx={{ borderRadius: 1.5, "& .MuiAlert-message": { fontSize: 13 } }}>
        This brief was drafted by <strong>{grant?.pi_name || "the PI"}</strong>. When ready, continue to <strong>Apply</strong> to submit your application or accept a PI invitation.
      </Alert>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" endIcon={<ArrowForwardIcon />} disabled={acknowledging || isAhead} onClick={acknowledgeBrief}
          sx={{ bgcolor: "#7c3aed", textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
          {acknowledging ? "Continuing…" : "Continue to Apply"}
        </Button>
      </Box>
    </Stack>
  );

  const renderPIApplyPanel = () => (
    <PiApplyPanel
      grant={grant}
      grantId={grantId}
      lifecycle={lifecycle}
      projectTitle={projectTitle}
      setProjectTitle={setProjectTitle}
      candidate={candidate}
      setCandidate={setCandidate}
      applicationPath={applicationPath}
      setApplicationPath={setApplicationPath}
      onSave={saveCandidateDraft}
      onSubmit={submitPiApplication}
      onAcceptInvite={acceptPiInvite}
      onUploaded={handleCandidateUploadSync}
      saving={saving}
      submitting={submitting}
      submitted={applicationSubmitted}
      endorsed={piEndorsed}
      piInvitePending={piInvitePending}
      locked={isAhead}
    />
  );

  const renderCompliancePanel = () => (
    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Compliance, Ethics & Safety Gates</Typography>
      <FormControlLabel control={<Checkbox checked={humanSubjects} disabled={isAhead} onChange={(e) => setHumanSubjects(e.target.checked)} />} label="Human subjects research (IRB)" />
      {humanSubjects && <TextField fullWidth size="small" label="IRB protocol number" value={irbProtocol} disabled={isAhead} onChange={(e) => setIrbProtocol(e.target.value)} sx={{ mb: 2, ml: 4 }} />}
      <FormControlLabel control={<Checkbox checked={animalSubjects} disabled={isAhead} onChange={(e) => setAnimalSubjects(e.target.checked)} />} label="Animal subjects (IACUC)" />
      {animalSubjects && <TextField fullWidth size="small" label="IACUC protocol number" value={iacucProtocol} disabled={isAhead} onChange={(e) => setIacucProtocol(e.target.value)} sx={{ mb: 2, ml: 4 }} />}
      <FormControlLabel control={<Checkbox checked={recombinantDna} disabled={isAhead} onChange={(e) => setRecombinantDna(e.target.checked)} />} label="Recombinant DNA / biosafety (IBC)" />
      {recombinantDna && <TextField fullWidth size="small" label="IBC protocol number" value={ibcProtocol} disabled={isAhead} onChange={(e) => setIbcProtocol(e.target.value)} sx={{ mb: 2, ml: 4 }} />}
      <Divider sx={{ my: 2 }} />
      <FormControlLabel control={<Checkbox checked={coiStudent} disabled={isAhead} onChange={(e) => setCoiStudent(e.target.checked)} />} label="Student COI disclosure signed" />
      <FormControlLabel control={<Checkbox checked={coiPi} disabled={isAhead} onChange={(e) => setCoiPi(e.target.checked)} />} label="PI COI disclosure signed" />
      <Box sx={{ mt: 2, display: "flex", gap: 1.5 }}>
        <Button variant="outlined" onClick={saveCompliance} disabled={saving || isAhead} sx={{ textTransform: "none", borderRadius: 1.5 }}>Save</Button>
        <Button variant="contained" onClick={submitCompliance} disabled={submitting || isAhead} sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
          Clear compliance → Routing
        </Button>
      </Box>
    </Paper>
  );

  const renderReadOnlyPanel = (icon, title, body) => (
    <Paper elevation={0} sx={{ p: 4, border: `1px solid ${ST.colors.border}`, borderRadius: 2, textAlign: "center" }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: ST.colors.bg, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>{body}</Typography>
    </Paper>
  );

  /* ── Render the active step's panel ── */
  const renderStepContent = () => {
    let content = null;

    if (grantCategory === "pi") {
      switch (currentStageConfig?.key) {
        case "project_brief":       content = renderPIBriefPanel(); break;
        case "apply":               content = renderPIApplyPanel(); break;
        case "compliance_review":   content = <PiComplianceReviewPanel grant={grant} lifecycle={lifecycle} />; break;
        case "offer_acceptance":    content = <PiOfferPanel grant={grant} lifecycle={lifecycle} onAccept={acceptOffer} accepting={acceptingOffer} locked={isAhead} />; break;
        case "active_work":         content = <PiActiveWorkPanel grant={grant} lifecycle={lifecycle} />; break;
        default:                    break;
      }
    } else {
      switch (currentStageConfig?.key) {
        case "application": content = renderProposalPanel(); break;
        case "compliance":  content = renderCompliancePanel(); break;
        case "decision":
          content = renderReadOnlyPanel(
            <HourglassEmptyIcon sx={{ color: ST.colors.warning, fontSize: 24 }} />,
            "Award Decision Pending",
            "The awards committee is reviewing your application. Decisions are communicated via email and reflected in your grants dashboard."
          );
          break;
        case "active":
          content = renderReadOnlyPanel(
            <CheckCircleIcon sx={{ color: ST.colors.success, fontSize: 24 }} />,
            "Active Grant",
            "Your grant is approved. Use the grant tracking dashboard to manage your budget and submit milestone reports."
          );
          break;
        default: break;
      }
    }

    return <GrantStepPreview locked={isAhead}>{content}</GrantStepPreview>;
  };

  return (
    <Box sx={{ width: "100%" }}>
      {showHeader && (
        <>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(backHref)}
            sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary }}>
            {backLabel}
          </Button>
          <Typography variant="h5" fontWeight={700}>{grant?.scholarship_name || "Research Grant Workspace"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {grantCategory === "pi" ? "PI Grant" : "University Grant"} · Stage: {stageLabel(stageKey)}
          </Typography>
        </>
      )}

      {showStepper && (
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
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {renderStepContent()}
          </Box>
        </Box>
      )}

      {!showStepper && (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {renderStepContent()}
        </>
      )}
    </Box>
  );
}
