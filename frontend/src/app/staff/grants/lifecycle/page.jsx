"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import GrantLifecycleStepper from "@/components/grants/GrantLifecycleStepper";
import { ROUTING_LABELS, stageLabel } from "@/lib/grantLifecycle";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";

const PEER_DIMS = ["merit", "impact", "feasibility", "budget"];

export default function StaffGrantLifecyclePage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [peerScores, setPeerScores] = useState({ merit: 4, impact: 4, feasibility: 4, budget: 4 });
  const [wbsCode, setWbsCode] = useState("");
  const [awardAmount, setAwardAmount] = useState("");
  const [routingComments, setRoutingComments] = useState("");

  const [letterRef, setLetterRef] = useState("");

  const reload = () => {
    setLoading(true);
    apiFetch("/sis-lms/grants/applications/staff?limit=500")
      .then((res) => setApps(res.applications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const sel = selected;
  const lc = sel?.lifecycle || {};
  const stageKey = sel?.lifecycle_stage || lc.stage_key || "proposal_budget";
  const isPiGrant = String(sel?.grant_id || sel?.grant_external_id || "").startsWith("pi-");
  const cr = lc.compliance_review || {};
  const offer = lc.offer || {};

  const act = async (fn) => {
    setError("");
    try {
      await fn();
      reload();
      if (sel?.id) {
        const res = await apiFetch("/sis-lms/grants/applications/staff?limit=500");
        const updated = (res.applications || []).find((a) => a.id === sel.id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Grant lifecycle pipeline</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        End-to-end postgraduate research grant workflow — PI confirmation, OSP routing, peer review, post-award ledger
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Paper elevation={0} sx={{ flex: "1 1 280px", maxHeight: 480, overflow: "auto", border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          {apps.length === 0 ? (
            <Typography sx={{ p: 3, color: ST.colors.textSecondary }}>No grant applications yet</Typography>
          ) : (
            apps.map((a) => (
              <Box
                key={a.id}
                onClick={() => setSelected(a)}
                sx={{
                  px: 2, py: 1.5, cursor: "pointer",
                  bgcolor: selected?.id === a.id ? `${BRAND.teal}12` : "transparent",
                  borderBottom: `1px solid ${ST.colors.border}`,
                }}
              >
                <Typography variant="body2" fontWeight={700}>{a.project_title || a.grant_name}</Typography>
                <Typography variant="caption" color="text.secondary">{a.recipient} · {stageLabel(a.lifecycle_stage)}</Typography>
              </Box>
            ))
          )}
        </Paper>

        <Paper elevation={0} sx={{ flex: "2 1 400px", p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          {!sel ? (
            <Typography color="text.secondary">Select an application to manage its lifecycle stage</Typography>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={700}>{sel.project_title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{sel.recipient} · {sel.grant_name}</Typography>
              <GrantLifecycleStepper currentStage={stageKey} compact />

              {isPiGrant && lc.proposal?.pi_confirmed && cr.overall_status !== "cleared" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>PI grant — compliance review (RDO)</Typography>
                  <Alert severity="info" sx={{ mb: 1.5, fontSize: 13 }}>
                    Verify funder eligibility: citizenship/residency, right to work, degree status. Clear all checks before issuing an offer.
                  </Alert>
                  <Button variant="contained" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/compliance-review`, {
                    method: "PATCH",
                    body: {
                      overall_status: "cleared",
                      funder_eligibility: { status: "cleared", citizenship_ok: true, right_to_work_ok: true, degree_status_ok: true },
                      ethics: { status: "cleared" },
                      enrolment: { status: "cleared" },
                      coi: { status: "cleared" },
                    },
                  }))} sx={{ bgcolor: "#7c3aed", textTransform: "none", mr: 1 }}>
                    Mark compliance cleared
                  </Button>
                </Box>
              )}

              {isPiGrant && cr.overall_status === "cleared" && offer.status !== "issued" && offer.status !== "accepted" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>PI grant — issue offer letter</Typography>
                  <TextField size="small" label="Offer reference" value={letterRef} onChange={(e) => setLetterRef(e.target.value)} placeholder="OFFER-2026-001" sx={{ mr: 1, mb: 1 }} />
                  <Button variant="contained" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/offer/issue`, {
                    method: "POST",
                    body: { letter_ref: letterRef || `OFFER-${sel.id}` },
                  }))} sx={{ bgcolor: BRAND.teal, textTransform: "none" }}>
                    Issue offer
                  </Button>
                </Box>
              )}

              {stageKey === "proposal_budget" && !lc.proposal?.pi_confirmed && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    {isPiGrant ? "Awaiting supervisor endorsement after student application" : "Awaiting PI sponsorship confirmation to unlock student budget builder"}
                  </Alert>
                  {!isPiGrant && (
                  <Button variant="contained" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/pi-confirm`, { method: "POST" }))} sx={{ bgcolor: BRAND.teal, textTransform: "none" }}>
                    Confirm PI sponsorship
                  </Button>
                  )}
                </Box>
              )}

              {stageKey === "osp_routing" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Routing sign-off — current: {ROUTING_LABELS[lc.routing?.current_step] || lc.routing?.current_step}</Typography>
                  <TextField fullWidth size="small" multiline minRows={2} label="Comments (required if returning)" value={routingComments} onChange={(e) => setRoutingComments(e.target.value)} sx={{ mb: 1.5 }} />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="contained" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/routing/${lc.routing?.current_step}`, { method: "POST", body: { approved: true } }))} sx={{ bgcolor: BRAND.teal, textTransform: "none" }}>Approve step</Button>
                    <Button variant="outlined" color="warning" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/routing/${lc.routing?.current_step}`, { method: "POST", body: { approved: false, comments: routingComments } }))} sx={{ textTransform: "none" }}>Return to student</Button>
                  </Box>
                </Box>
              )}

              {stageKey === "peer_review" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Peer review rubric (1–5)</Typography>
                  {PEER_DIMS.map((d) => (
                    <TextField key={d} select size="small" label={d} value={peerScores[d]} onChange={(e) => setPeerScores((s) => ({ ...s, [d]: Number(e.target.value) }))} sx={{ mr: 1, mb: 1, minWidth: 120 }}>
                      {[1, 2, 3, 4, 5].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </TextField>
                  ))}
                  <Button variant="contained" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/peer-review`, { method: "POST", body: { scores: peerScores } }))} sx={{ display: "block", mt: 1, bgcolor: BRAND.navy, textTransform: "none" }}>
                    Submit panel scores
                  </Button>
                </Box>
              )}

              {(stageKey === "post_award" || lc.post_award?.status === "setup_required") && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Post-award WBS setup</Typography>
                  <TextField size="small" label="WBS / ledger code" value={wbsCode} onChange={(e) => setWbsCode(e.target.value)} placeholder="RES-2026-8841-CHEM" sx={{ mr: 1, mb: 1 }} />
                  <TextField size="small" type="number" label="Award amount (KES)" value={awardAmount} onChange={(e) => setAwardAmount(e.target.value)} sx={{ mb: 1 }} />
                  <Button variant="contained" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/post-award`, {
                    method: "POST",
                    body: {
                      wbs_code: wbsCode || `RES-${new Date().getFullYear()}-${sel.id}`,
                      award_amount: Number(awardAmount || sel.amount_requested || 0),
                      category_balances: { materials: Number(awardAmount || 0) * 0.4, travel: Number(awardAmount || 0) * 0.2, stipend: Number(awardAmount || 0) * 0.4 },
                    },
                  }))} sx={{ bgcolor: BRAND.teal, textTransform: "none" }}>
                    Create restricted ledger
                  </Button>
                </Box>
              )}

              {stageKey === "closeout" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Milestone sign-off (PI)</Typography>
                  {(lc.closeout?.milestones || []).filter((m) => m.status === "pending").map((m) => (
                    <Button key={m.id} size="small" variant="outlined" onClick={() => act(() => apiFetch(`/sis-lms/grants/applications/${sel.id}/milestones/${m.id}/sign`, { method: "POST" }))} sx={{ mr: 1, mb: 1, textTransform: "none" }}>
                      Sign: {m.label}
                    </Button>
                  ))}
                  {lc.post_award?.wbs_code && <Chip label={`Ledger: ${lc.post_award.wbs_code}`} size="small" sx={{ mt: 1 }} />}
                </Box>
              )}

              {stageKey === "compliance" && (
                <Alert severity="info" sx={{ mt: 2 }}>Student completing compliance & ethics disclosures — clearance status: {lc.compliance?.clearance_status}</Alert>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
