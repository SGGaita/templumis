"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import PiApplicationDocumentsUpload from "@/components/grants/PiApplicationDocumentsUpload";
import RichTextEditor from "@/components/RichTextEditor";

const PI_PURPLE = "#7c3aed";

const COMPLIANCE_STATUS = {
  not_started: { label: "Not started", color: ST.colors.textSecondary, bg: ST.colors.bg },
  pending: { label: "Under review", color: ST.colors.warning, bg: ST.colors.warningLight },
  cleared: { label: "Cleared", color: ST.colors.success, bg: ST.colors.successLight },
  failed: { label: "Action required", color: ST.colors.error, bg: ST.colors.errorLight },
};

const OFFER_STATUS = {
  not_started: { label: "Not issued", color: ST.colors.textSecondary, bg: ST.colors.bg },
  pending: { label: "Preparing offer", color: ST.colors.warning, bg: ST.colors.warningLight },
  issued: { label: "Awaiting your acceptance", color: ST.colors.info, bg: ST.colors.infoLight },
  accepted: { label: "Accepted", color: ST.colors.success, bg: ST.colors.successLight },
  declined: { label: "Declined", color: ST.colors.error, bg: ST.colors.errorLight },
};

function StatusChip({ status, map }) {
  const cfg = map[status] || { label: status || "Pending", color: ST.colors.warning, bg: ST.colors.warningLight };
  return <Chip size="small" label={cfg.label} sx={{ height: 22, fontWeight: 700, fontSize: 11, bgcolor: cfg.bg, color: cfg.color }} />;
}

/** Step 2 — Apply (recruitment: self-apply or PI invite → supervisor endorsement) */
export function PiApplyPanel({
  grant,
  grantId,
  lifecycle,
  projectTitle,
  setProjectTitle,
  candidate,
  setCandidate,
  applicationPath,
  setApplicationPath,
  onSave,
  onSubmit,
  onAcceptInvite,
  onUploaded,
  saving,
  submitting,
  submitted,
  endorsed,
  piInvitePending,
  locked = false,
}) {
  const isPostdoc = grant?.position_type === "postdoc";
  const piName = lifecycle?.proposal?.pi_name || grant?.pi_name || "the PI";
  const cand = candidate || {};
  const docs = cand.documents || [];
  const updateCandidate = (patch) => setCandidate((c) => ({ ...c, ...patch }));
  const inactive = locked || submitted;

  return (
    <Stack spacing={2.5}>
      {piInvitePending && applicationPath === "pi_invite" && (
        <Alert severity="info" icon={<MailOutlineIcon fontSize="small" />} sx={{ borderRadius: 1.5 }}>
          <strong>PI invitation.</strong> {piName} has invited you to this position. Accept the invitation and submit your application materials below.
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, borderLeft: `4px solid ${PI_PURPLE}` }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 0.5 }}>
          Apply — recruitment
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Applications are visible to <strong>admin staff</strong> and the <strong>financial-aid office</strong>. Your supervisor must endorse your application before compliance review begins.
        </Typography>

        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
          How are you joining this project?
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={applicationPath}
          onChange={(_, v) => v && !inactive && setApplicationPath(v)}
          sx={{ mb: 2.5 }}
          disabled={inactive}
        >
          <ToggleButton value="self_apply" sx={{ textTransform: "none", fontWeight: 600, px: 2 }}>
            <AssignmentIcon sx={{ fontSize: 16, mr: 0.75 }} /> I am applying
          </ToggleButton>
          <ToggleButton value="pi_invite" sx={{ textTransform: "none", fontWeight: 600, px: 2 }}>
            <MailOutlineIcon sx={{ fontSize: 16, mr: 0.75 }} /> PI invited me
          </ToggleButton>
        </ToggleButtonGroup>

        {applicationPath === "pi_invite" && !piInvitePending && !inactive && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5, fontSize: 13 }}>
            No pending invitation on file. If {piName} invited you, ask them to send the invite through the portal, or switch to <strong>I am applying</strong>.
          </Alert>
        )}

        {applicationPath === "pi_invite" && piInvitePending && !inactive && (
          <Box sx={{ mb: 2 }}>
            <Button variant="outlined" onClick={onAcceptInvite} disabled={saving || locked}
              sx={{ textTransform: "none", fontWeight: 600, borderColor: PI_PURPLE, color: PI_PURPLE, borderRadius: 1.5 }}>
              Accept PI invitation
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <TextField fullWidth size="small" label="Working title (optional)" value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)} disabled={inactive} sx={{ mb: 2 }} />

        <Box className="grant-rich-text-editor">
          <RichTextEditor
            label="Cover letter / motivation"
            value={cand.cover_letter || ""}
            onChange={(html) => updateCandidate({ cover_letter: html })}
            disabled={inactive}
            placeholder="Explain your fit for this project, relevant experience, and motivation…"
            minHeight={180}
          />
        </Box>

        {!isPostdoc && (
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <FormControlLabel control={<Checkbox checked={cand.enrolled !== false} disabled={inactive}
              onChange={(e) => updateCandidate({ enrolled: e.target.checked, concurrent_admission: e.target.checked ? false : cand.concurrent_admission })} />}
              label="I am already enrolled in a postgraduate programme" />
            {cand.enrolled === false && (
              <FormControlLabel control={<Checkbox checked={Boolean(cand.concurrent_admission)} disabled={inactive}
                onChange={(e) => updateCandidate({ concurrent_admission: e.target.checked })} />}
                label="I will apply for PhD admission concurrently" />
            )}
          </Stack>
        )}

        {isPostdoc && (
          <TextField fullWidth multiline minRows={2} label="Publications summary" value={cand.publications_summary || ""}
            onChange={(e) => updateCandidate({ publications_summary: e.target.value })} disabled={inactive} sx={{ mb: 2 }} />
        )}

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Application documents</Typography>
        <PiApplicationDocumentsUpload grantId={grantId} documents={docs} isPostdoc={isPostdoc} disabled={inactive}
          onChange={(next) => updateCandidate({ documents: next })} onUploaded={onUploaded} />

        {submitted && !endorsed && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 1.5 }}>
            Application submitted — awaiting <strong>supervisor endorsement</strong> from {piName}. Admin and financial-aid staff can review your application while endorsement is pending.
          </Alert>
        )}
        {submitted && endorsed && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 1.5 }}>
            <strong>{piName}</strong> has endorsed your application. Proceed to <strong>Compliance Checks</strong>.
          </Alert>
        )}

        {!submitted && !locked && (
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 2 }}>
            <Button variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={onSave}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}>Save draft</Button>
            <Button variant="contained" startIcon={<SendIcon />} disabled={submitting} onClick={onSubmit}
              sx={{ bgcolor: PI_PURPLE, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </Box>
        )}
        {!submitted && locked && (
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 2 }}>
            <Button variant="outlined" disabled sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}>Save draft</Button>
            <Button variant="contained" disabled sx={{ bgcolor: PI_PURPLE, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
              Submit application
            </Button>
          </Box>
        )}
        {submitted && (
          <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />} label="Application submitted"
            sx={{ mt: 2, bgcolor: ST.colors.successLight, color: ST.colors.success, fontWeight: 700, "& .MuiChip-icon": { color: `${ST.colors.success} !important` } }} />
        )}
      </Paper>
    </Stack>
  );
}

/** Step 3 — Compliance checks (RDO funder eligibility + other checks) */
export function PiComplianceReviewPanel({ grant, lifecycle }) {
  const cr = lifecycle?.compliance_review || {};
  const isPostdoc = grant?.position_type === "postdoc";

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy }}>Review & compliance</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7, maxWidth: 560 }}>
              RDO and the grants office verify you meet all grant conditions before an offer is issued.
            </Typography>
          </Box>
          <StatusChip status={cr.overall_status} map={COMPLIANCE_STATUS} />
        </Box>

        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
          Compliance checks
        </Typography>
        <Stack spacing={1}>
          {[
            { label: "Ethics / IRB alignment", status: cr.ethics?.status || "pending" },
            { label: isPostdoc ? "Employment eligibility (HR)" : "Graduate School enrolment", status: cr.enrolment?.status || "pending" },
            { label: "Conflict of interest disclosures", status: cr.coi?.status || "pending" },
          ].map(({ label, status }) => (
            <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: `1px solid ${ST.colors.border}` }}>
              <Typography variant="body2" sx={{ fontSize: 13 }}>{label}</Typography>
              <StatusChip status={status === "cleared" || status === "not_required" ? "cleared" : status === "failed" ? "failed" : "pending"} map={COMPLIANCE_STATUS} />
            </Box>
          ))}
        </Stack>

        {cr.overall_status === "cleared" && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 1.5 }}>Compliance cleared — an offer letter will be issued next.</Alert>
        )}
        {cr.overall_status === "failed" && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5 }}>{cr.notes || "Compliance review flagged issues. Contact the Research Development Office."}</Alert>
        )}
      </Paper>
    </Stack>
  );
}

/** Step 4 — Offer issued & candidate acceptance */
export function PiOfferPanel({ lifecycle, grant, onAccept, accepting, locked = false }) {
  const offer = lifecycle?.offer || {};

  return (
    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy }}>Offer & acceptance</Typography>
        <StatusChip status={offer.status} map={OFFER_STATUS} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
        Accept the offer letter to begin your grant-funded research under PI supervision.
      </Typography>

      {offer.status === "issued" && (
        <Box sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Offer reference</Typography>
          <Typography variant="body2" fontWeight={700}>{offer.letter_ref || "Offer letter on file"}</Typography>
          {offer.issued_at && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Issued {new Date(offer.issued_at).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      )}

      {offer.status === "issued" && (
        <Button variant="contained" onClick={onAccept} disabled={accepting || locked}
          sx={{ bgcolor: PI_PURPLE, textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
          {accepting ? "Accepting…" : "Accept offer"}
        </Button>
      )}
      {offer.status === "accepted" && (
        <Alert severity="success" sx={{ borderRadius: 1.5 }}>
          Offer accepted — proceed to <strong>Active Work & Reporting</strong>.
        </Alert>
      )}
      {(offer.status === "not_started" || offer.status === "pending") && (
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          Your application passed compliance review. The offer letter is being prepared.
        </Alert>
      )}
    </Paper>
  );
}

/** Step 5 — Active work & reporting */
export function PiActiveWorkPanel({ lifecycle, grant }) {
  const post = lifecycle?.post_award || {};
  const close = lifecycle?.closeout || {};
  const sow = grant?.scope_of_work || {};

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, borderLeft: `4px solid ${ST.colors.success}` }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1 }}>Active work & reporting</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2 }}>
          Grant-funded research is underway under PI supervision. Complete milestone reviews per the grant schedule. All outputs must comply with the funder&apos;s IP and open-access requirements.
        </Typography>
        {post.wbs_code && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 2 }}>
            {[
              { label: "Grant cost centre", value: post.wbs_code },
              { label: "Award ceiling", value: post.award_amount ? `KES ${Number(post.award_amount).toLocaleString()}` : "—" },
              { label: "Status", value: "Active", color: ST.colors.success },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ bgcolor: ST.colors.bg, borderRadius: 1.5, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: color || BRAND.navy }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {(close.milestones || sow.milestones || []).length > 0 && (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1.5 }}>Milestone reviews</Typography>
          {(close.milestones || []).map((m) => (
            <Box key={m.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.875, borderBottom: `1px solid ${ST.colors.border}` }}>
              <Typography variant="body2" sx={{ fontSize: 13 }}>{m.label}</Typography>
              <Chip size="small" label={m.status} sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />
            </Box>
          ))}
          {!(close.milestones || []).length && (sow.milestones || []).map((m, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.875, borderBottom: `1px solid ${ST.colors.border}` }}>
              <Typography variant="body2" sx={{ fontSize: 13 }}>{m.label}</Typography>
              <Chip size="small" label="Scheduled" sx={{ height: 20, fontSize: 11 }} />
            </Box>
          ))}
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND.navy, mb: 1 }}>Funder reporting & close-out</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: 13 }}>
          Your progress feeds the PI&apos;s reports to the funder. RDO facilitates submission; Finance handles financial reports.
          All publications must acknowledge the grant number. A final report is required at project end.
        </Typography>
        {sow.reporting_obligations && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5, fontSize: 13 }}>{sow.reporting_obligations}</Alert>
        )}
        {(sow.expected_outputs || []).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 1 }}>Expected outputs</Typography>
            {sow.expected_outputs.map((o, i) => (
              <Typography key={i} variant="body2" sx={{ fontSize: 13, mb: 0.5 }}>• {o}</Typography>
            ))}
          </>
        )}
      </Paper>
    </Stack>
  );
}
