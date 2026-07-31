"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Slider from "@mui/material/Slider";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GavelIcon from "@mui/icons-material/Gavel";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { staffAwardChipStyle } from "@/lib/scholarshipWorkflow";

function formatKes(amount) {
  return `KES ${Number(amount || 0).toLocaleString()}`;
}

export default function DecisionStackRanking() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [budget, setBudget] = useState(100000);
  const [ranking, setRanking] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [editingAmounts, setEditingAmounts] = useState({});

  const loadRanking = useCallback(async (b) => {
    setLoading(true);
    setError("");
    try {
      const [rankRes, disputeRes] = await Promise.all([
        apiFetch(`/sis-lms/financial-aid/evaluation/stack-ranking?budget=${b}`),
        apiFetch("/sis-lms/financial-aid/evaluation/disputes"),
      ]);
      setRanking(rankRes);
      setDisputes(disputeRes.disputes || []);
      const amounts = {};
      (rankRes.rows || []).forEach((row) => {
        amounts[row.application_id] = row.proposed_award;
      });
      setEditingAmounts(amounts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    apiFetch("/sis-lms/financial-aid/evaluation/settings")
      .then((s) => {
        const b = s.award_budget_pool || 100000;
        setBudget(b);
        return loadRanking(b);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [loadRanking]);

  const applyBudget = () => loadRanking(budget);

  const applyFormulaAwards = async () => {
    setBusy("formula");
    setSuccess("");
    try {
      const res = await apiFetch("/sis-lms/financial-aid/evaluation/apply-recommended-awards", {
        method: "POST",
        body: { budget },
      });
      setSuccess(res.message || "Formula awards applied.");
      await loadRanking(budget);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const saveProposedAward = async (applicationId) => {
    const amount = editingAmounts[applicationId];
    if (amount == null || amount === "") return;
    setBusy(`award-${applicationId}`);
    try {
      await apiFetch(`/sis-lms/financial-aid/evaluation/applications/${applicationId}/proposed-award`, {
        method: "PATCH",
        body: { award_amount: Number(amount) },
      });
      setSuccess("Award amount saved.");
      await loadRanking(budget);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const resolveDispute = async (applicationId) => {
    setBusy(`resolve-${applicationId}`);
    try {
      await apiFetch(`/sis-lms/financial-aid/evaluation/applications/${applicationId}/resolve`, {
        method: "POST",
      });
      setSuccess("Application approved for ranking.");
      await loadRanking(budget);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const saveBudgetPool = async () => {
    setBusy("save-budget");
    try {
      await apiFetch("/sis-lms/financial-aid/evaluation/settings", {
        method: "PATCH",
        body: { award_budget_pool: budget },
      });
      setSuccess("Budget pool saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const approveAndSendOffers = async () => {
    if (!ranking?.rows?.some((r) => r.within_budget && r.award_status_label === "Proposed")) {
      setError(
        "No proposed applications within budget, or offers were already sent. Update the ranking first."
      );
      return;
    }
    setBusy("send-offers");
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch("/sis-lms/financial-aid/awards/approve-and-send-offers", {
        method: "POST",
        body: { budget },
      });
      setSuccess(res.message || `Offers sent to ${res.offers_sent ?? 0} student(s).`);
      await loadRanking(budget);
    } catch (e) {
      setError(e.message || "Could not send offers. Check the backend is running and try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <EmojiEventsIcon sx={{ color: BRAND.navy }} />
        <Typography variant="h5" fontWeight={700}>
          Review Outcome and Awards
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rank reconciled applications by committee scores and need, set proposed award amounts within your
        budget, then approve and send formal offers.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {ranking?.budget_constrained && (
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            Budget is tighter than full scholarship values
          </Typography>
          <Typography variant="body2">
            Total at maximum would be {formatKes(ranking.total_ceiling)} but your pool is{" "}
            {formatKes(ranking.budget)}. Use <strong>Apply score &amp; need formula</strong> to scale awards
            down, or edit each row manually.
          </Typography>
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Remaining award budget
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: BRAND.teal, mb: 1 }}>
          {formatKes(budget)}
        </Typography>
        <Slider
          value={budget}
          min={10000}
          max={500000}
          step={5000}
          onChange={(_, v) => setBudget(v)}
          sx={{ maxWidth: 480 }}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          <Button variant="contained" onClick={applyBudget} sx={{ bgcolor: BRAND.teal, textTransform: "none" }}>
            Update ranking
          </Button>
          <Button
            variant="outlined"
            startIcon={<AutoFixHighIcon />}
            onClick={applyFormulaAwards}
            disabled={busy === "formula"}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {busy === "formula" ? "Applying…" : "Apply score & need formula"}
          </Button>
          <Button
            variant="outlined"
            onClick={saveBudgetPool}
            disabled={busy === "save-budget"}
            sx={{ textTransform: "none" }}
          >
            Save as default pool
          </Button>
          <Button
            variant="contained"
            onClick={approveAndSendOffers}
            disabled={busy === "send-offers" || !ranking?.proposed_count}
            sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 700 }}
          >
            {busy === "send-offers" ? "Sending…" : "Approve & send offers"}
          </Button>
        </Stack>
        {ranking && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
              {ranking.proposed_count ?? ranking.funded_count} proposed · {ranking.funded_count} credited to
              tuition · {ranking.pending_scores} awaiting scores · {ranking.disputed_count} in dispute
            </Typography>
            {ranking.allocation_formula && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {ranking.allocation_formula}
              </Typography>
            )}
          </>
        )}
      </Paper>

      {disputes.length > 0 && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: `2px solid ${ST.colors.warning}`, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <GavelIcon sx={{ color: ST.colors.warning }} />
            <Typography variant="subtitle1" fontWeight={800}>
              Calibration room — score disputes ({disputes.length})
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            High variance between reviewers. Resolve before including in the ranking.
          </Typography>
          <Stack spacing={2}>
            {disputes.map((d) => (
              <Paper key={d.application_id} variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography fontWeight={700}>{d.anonymized_id}</Typography>
                    <Typography variant="body2" color="text.secondary">{d.scholarship_name}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Consensus {d.consensus_score} · σ = {d.score_std_dev} (threshold {d.variance_threshold})
                    </Typography>
                    {d.reviewer_scores?.map((r, i) => (
                      <Typography key={i} variant="caption" display="block" color="text.secondary">
                        {r.reviewer_name}: composite {r.composite} (A{r.academic} N{r.need} L{r.lead})
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => resolveDispute(d.application_id)}
                    disabled={busy === `resolve-${d.application_id}`}
                    sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600 }}
                  >
                    Approve for ranking
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: ST.colors.bg }}>
                  <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pseudonym ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scholarship</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Score</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Need</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Max (KES)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Proposed award</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Running total</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(ranking?.rows || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      No reconciled applications yet. Committee must finish scoring first.
                    </TableCell>
                  </TableRow>
                ) : (
                  ranking.rows.map((row) => {
                    const isCutoff = row.rank === ranking.cutoff_rank;
                    const edited = editingAmounts[row.application_id];
                    const dirty = edited != null && Number(edited) !== row.proposed_award;
                    return (
                      <Fragment key={row.application_id}>
                        {isCutoff && (
                          <TableRow>
                            <TableCell colSpan={9} sx={{ py: 1, bgcolor: `${ST.colors.warning}18`, border: 0 }}>
                              <Typography variant="caption" fontWeight={800} sx={{ color: ST.colors.warning }}>
                                ═══ BUDGET LIMIT CUT-OFF ═══
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow
                          sx={{
                            bgcolor: row.within_budget ? "transparent" : `${ST.colors.error}06`,
                            opacity: row.within_budget ? 1 : 0.9,
                          }}
                        >
                          <TableCell>{row.rank}.</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{row.anonymized_id}</TableCell>
                          <TableCell>{row.scholarship_name}</TableCell>
                          <TableCell align="right">
                            <Tooltip title={`Merit weight: ${row.merit_weight ?? "—"}`}>
                              <span>{row.consensus_score?.toFixed(2)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">{row.need_index ?? "—"}</TableCell>
                          <TableCell align="right">{formatKes(row.max_scholarship_amount)}</TableCell>
                          <TableCell align="right" sx={{ minWidth: 160 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                              <TextField
                                size="small"
                                type="number"
                                value={edited ?? row.proposed_award}
                                onChange={(e) =>
                                  setEditingAmounts((prev) => ({
                                    ...prev,
                                    [row.application_id]: e.target.value,
                                  }))
                                }
                                inputProps={{ min: 0, max: row.max_scholarship_amount, step: 500 }}
                                sx={{ width: 110 }}
                              />
                              {dirty && (
                                <Button
                                  size="small"
                                  onClick={() => saveProposedAward(row.application_id)}
                                  disabled={busy === `award-${row.application_id}`}
                                  sx={{ textTransform: "none", minWidth: 0, px: 1 }}
                                >
                                  Save
                                </Button>
                              )}
                            </Stack>
                            {row.award_scale_pct != null && row.award_scale_pct < 100 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {row.award_scale_pct}% of max
                              </Typography>
                            )}
                            {row.is_manual_override && (
                              <Chip label="Manual" size="small" sx={{ mt: 0.5, height: 18, fontSize: 10 }} />
                            )}
                          </TableCell>
                          <TableCell align="right">{formatKes(row.cumulative_liability)}</TableCell>
                          <TableCell align="center">
                            {(() => {
                              const label =
                                row.award_status_label || (row.within_budget ? "Proposed" : "Over budget");
                              const style = staffAwardChipStyle(label);
                              return (
                                <Chip
                                  size="small"
                                  label={label}
                                  sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700 }}
                                />
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
