"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import PiProjectBrief from "@/components/grants/PiProjectBrief";
import PiApplicationDocumentsUpload from "@/components/grants/PiApplicationDocumentsUpload";

const PI_PURPLE = "#7c3aed";

function PhaseHeader({ phase, step, title, actors }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" sx={{ color: PI_PURPLE, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {phase} · Step {step}
      </Typography>
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mt: 0.25 }}>
        {title}
      </Typography>
      {actors && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Responsible: {actors}
        </Typography>
      )}
    </Box>
  );
}

function StatusChip({ status, map }) {
  const cfg = map[status] || { label: status || "Pending", color: ST.colors.warning, bg: ST.colors.warningLight };
  return (
    <Chip size="small" label={cfg.label}
      sx={{ height: 22, fontWeight: 700, fontSize: 11, bgcolor: cfg.bg, color: cfg.color }} />
  );
}

/** Step 4 — Recruitment: position advertised or candidate matched */
export function PiRecruitmentPanel({ grant, lifecycle, onContinue, onAcknowledge, acknowledging }) {
  const isPostdoc = grant?.position_type === "postdoc" || lifecycle?.recruitment?.position_type === "postdoc";
  const rec = lifecycle?.recruitment || {};
  const acknowledged = rec.brief_acknowledged;

  return (
    <Stack spacing={2.5}>
      <PhaseHeader
        phase="Phase 3 · Recruitment"
        step={4}
        title="Position advertised or candidate matched"
        actors={isPostdoc ? "PI · Finance/HR" : "PI"}
      />
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, borderLeft: `4px solid ${PI_PURPLE}` }}>
        {isPostdoc ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2 }}>
              For this <strong>postdoctoral position</strong>, Finance/HR will run a formal job posting with shortlisting, interviews, and reference checks before candidates proceed.
            </Typography>
            <Stack spacing={1}>
              {[
                { label: "HR job posting", done: rec.hr_posting_live || rec.position_ready },
                { label: "Shortlisting & interviews", done: rec.status === "application_received" || rec.status === "candidate_selected" },
                { label: "Reference checks", done: rec.status === "candidate_selected" },
              ].map(({ label, done }) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {done ? <CheckCircleIcon sx={{ fontSize: 16, color: ST.colors.success }} /> : <HourglassEmptyIcon sx={{ fontSize: 16, color: ST.colors.warning }} />}
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{label}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2 }}>
              For this <strong>PhD project</strong>, {grant?.pi_name || "the PI"} matches candidates from the applicant pool or an existing supervisory relationship. A supervisory agreement is drafted for the selected candidate.
            </Typography>
            <Stack spacing={1}>
              {[
                { label: "PI matching from applicant pool", done: rec.position_ready || acknowledged },
                { label: "Supervisory agreement drafted", done: rec.supervisory_agreement_drafted || rec.status === "candidate_selected" },
              ].map(({ label, done }) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {done ? <CheckCircleIcon sx={{ fontSize: 16, color: ST.colors.success }} /> : <HourglassEmptyIcon sx={{ fontSize: 16, color: ST.colors.warning }} />}
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{label}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
        <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5, fontSize: 13 }}>
          {isPostdoc
            ? "Once the position is live, submit your formal application (CV, cover letter, publications) in the next step."
            : "If the PI has indicated you are a match, proceed to accept the offer and submit your application materials."}
        </Alert>
      </Paper>
      {!acknowledged ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" endIcon={<ArrowForwardIcon />} disabled={acknowledging} onClick={onAcknowledge}
            sx={{ bgcolor: PI_PURPLE, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            {acknowledging ? "Starting…" : "Enter recruitment phase"}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={onContinue}
            sx={{ bgcolor: PI_PURPLE, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            Continue to application
          </Button>
        </Box>
      )}
    </Stack>
  );
}

/** Step 5 — Candidate application or offer acceptance */
export function PiCandidateApplicationPanel({
  grant,
  grantId,
  lifecycle,
  app,
  projectTitle,
  setProjectTitle,
  candidate,
  setCandidate,
  onSave,
  onSubmit,
  saving,
  submitting,
  submitted,
  piConfirmed,
  onUploaded,
}) {
  const isPostdoc = grant?.position_type === "postdoc";
  const cand = lifecycle?.candidate || candidate || {};
  const docs = cand.documents || [];
  const piName = lifecycle?.proposal?.pi_name || grant?.pi_name;

  const updateCandidate = (patch) => setCandidate((c) => ({ ...c, ...patch }));

  return (
    <Stack spacing={2.5}>
      <PhaseHeader
        phase="Phase 3 · Recruitment"
        step={5}
        title="Application submitted or offer accepted"
        actors="Candidate"
      />
      <PiProjectBrief grant={grant} compact />

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        {isPostdoc ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
            Submit your formal postdoc application: <strong>CV</strong>, <strong>cover letter</strong>, and <strong>publications</strong>.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
            Accept the PI offer from <strong>{piName}</strong> and submit your application. If you are not yet enrolled, apply for PhD admission concurrently.
          </Typography>
        )}

        {!isPostdoc && (
          <Stack spacing={1} sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={Boolean(cand.offer_accepted)} disabled={submitted}
                onChange={(e) => updateCandidate({ offer_accepted: e.target.checked })} />}
              label={`I accept the PI offer for this PhD project brief`}
            />
            <FormControlLabel
              control={<Checkbox checked={cand.enrolled !== false} disabled={submitted}
                onChange={(e) => updateCandidate({ enrolled: e.target.checked, concurrent_admission: e.target.checked ? false : cand.concurrent_admission })} />}
              label="I am already enrolled in a postgraduate programme"
            />
            {cand.enrolled === false && (
              <FormControlLabel
                control={<Checkbox checked={Boolean(cand.concurrent_admission)} disabled={submitted}
                  onChange={(e) => updateCandidate({ concurrent_admission: e.target.checked })} />}
                label="I will apply for PhD admission concurrently with this grant application"
              />
            )}
          </Stack>
        )}

        <TextField fullWidth size="small" label="Working title (optional)" value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)} disabled={submitted} sx={{ mb: 2 }} />

        <TextField fullWidth multiline minRows={4} label={isPostdoc ? "Cover letter" : "Motivation / cover note"}
          value={cand.cover_letter || ""} onChange={(e) => updateCandidate({ cover_letter: e.target.value })}
          disabled={submitted} sx={{ mb: 2 }} />

        {isPostdoc && (
          <TextField fullWidth multiline minRows={2} label="Publications summary"
            placeholder="List key publications with DOIs or journal names"
            value={cand.publications_summary || ""} onChange={(e) => updateCandidate({ publications_summary: e.target.value })}
            disabled={submitted} sx={{ mb: 2 }} />
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Application documents</Typography>
        <PiApplicationDocumentsUpload
          grantId={grantId}
          documents={docs}
          isPostdoc={isPostdoc}
          disabled={submitted}
          onChange={(next) => updateCandidate({ documents: next })}
          onUploaded={onUploaded}
        />

        {submitted && !piConfirmed && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 1.5 }}>
            Application submitted — awaiting PI{isPostdoc ? "/HR" : ""} selection. You will be notified when a decision is made.
          </Alert>
        )}
        {submitted && piConfirmed && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 1.5 }}>
            You have been selected. Proceed to <strong>Onboarding Compliance</strong> (Steps 6–8).
          </Alert>
        )}

        {!submitted && (
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 2 }}>
            <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={onSave}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}>Save draft</Button>
            <Button variant="contained" startIcon={<SendIcon />} disabled={submitting} onClick={onSubmit}
              sx={{ bgcolor: PI_PURPLE, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
              {submitting ? "Submitting…" : isPostdoc ? "Submit postdoc application" : "Submit application & accept offer"}
            </Button>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}

const FUNDER_MAP = {
  not_started: { label: "Not started", color: ST.colors.textSecondary, bg: ST.colors.bg },
  pending: { label: "Under review", color: ST.colors.warning, bg: ST.colors.warningLight },
  cleared: { label: "Cleared", color: ST.colors.success, bg: ST.colors.successLight },
  failed: { label: "Failed — action required", color: ST.colors.error, bg: ST.colors.errorLight },
};

const CONTRACT_MAP = {
  not_started: { label: "Not started", color: ST.colors.textSecondary, bg: ST.colors.bg },
  pending: { label: "Processing", color: ST.colors.warning, bg: ST.colors.warningLight },
  issued: { label: "Issued", color: ST.colors.success, bg: ST.colors.successLight },
};

const ETHICS_MAP = {
  not_required: { label: "Not required", color: ST.colors.success, bg: ST.colors.successLight },
  pending: { label: "Amendment pending (4–8 weeks)", color: ST.colors.warning, bg: ST.colors.warningLight },
  approved: { label: "Approved", color: ST.colors.success, bg: ST.colors.successLight },
};

/** Steps 6–8 — Onboarding compliance (read-only for candidate) */
export function PiOnboardingPanel({ grant, lifecycle, stepKey }) {
  const isPostdoc = grant?.position_type === "postdoc";
  const onboard = lifecycle?.onboarding || {};
  const fe = onboard.funder_eligibility || {};
  const ct = onboard.contract || {};
  const eth = onboard.ethics_amendment || {};

  if (stepKey === "funder_eligibility") {
    return (
      <Stack spacing={2}>
        <PhaseHeader phase="Phase 4 · Onboarding Compliance" step={6} title="Funder eligibility check on candidate" actors="RDO" />
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.7 }}>
              The Research Development Office verifies you meet grant conditions: citizenship/residency restrictions, right to work, and degree status. Some government grants restrict who may be employed.
            </Typography>
            <StatusChip status={fe.status} map={FUNDER_MAP} />
          </Box>
          <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ borderRadius: 1.5, mb: 2, fontSize: 13 }}>
            <strong>Most common failure:</strong> overlooking nationality or residency conditions set in the original grant agreement.
          </Alert>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
            {[
              { label: "Citizenship / residency", ok: fe.citizenship_ok },
              { label: "Right to work", ok: fe.right_to_work_ok },
              { label: "Degree status", ok: fe.degree_status_ok },
            ].map(({ label, ok }) => (
              <Box key={label} sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: ok === true ? ST.colors.success : ok === false ? ST.colors.error : ST.colors.textSecondary }}>
                  {ok === true ? "Verified" : ok === false ? "Issue flagged" : "Pending"}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Stack>
    );
  }

  if (stepKey === "contract_stipend") {
    return (
      <Stack spacing={2}>
        <PhaseHeader phase="Phase 4 · Onboarding Compliance" step={7} title="Employment contract or stipend letter issued" actors="Finance/HR" />
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.7 }}>
              {isPostdoc
                ? "Finance/HR issues an employment contract and sets up payroll. Charges are assigned to the grant cost centre."
                : "Graduate School issues a stipend/bursary agreement charged to the grant cost centre."}
            </Typography>
            <StatusChip status={ct.status} map={CONTRACT_MAP} />
          </Box>
          {isPostdoc && (
            <Alert severity="info" sx={{ borderRadius: 1.5, fontSize: 13 }}>
              <strong>Bottleneck:</strong> Postdoc HR processing typically takes 4–6 weeks — plan start dates well in advance.
            </Alert>
          )}
          {ct.issued_at && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Issued: {new Date(ct.issued_at).toLocaleDateString()}
            </Typography>
          )}
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <PhaseHeader phase="Phase 4 · Onboarding Compliance" step={8} title="Ethics amendment if candidate scope has changed" actors="RDO" />
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.7 }}>
            If your specific research activities were not covered in the original ethics approval, an amendment must be filed and approved before work begins.
          </Typography>
          <StatusChip status={eth.status} map={ETHICS_MAP} />
        </Box>
        {eth.status === "pending" && (
          <Alert severity="warning" sx={{ borderRadius: 1.5, fontSize: 13 }}>
            Ethics amendment in progress — typically adds <strong>4–8 weeks</strong> before research can start.
          </Alert>
        )}
        {eth.status === "not_required" && (
          <Alert severity="success" sx={{ borderRadius: 1.5, fontSize: 13 }}>
            No ethics amendment required — your scope aligns with the existing approval.
          </Alert>
        )}
        {onboard.onboarding_complete && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 1.5 }}>
            Onboarding complete. You may proceed to <strong>Proposal & Budget</strong>.
          </Alert>
        )}
      </Paper>
    </Stack>
  );
}
