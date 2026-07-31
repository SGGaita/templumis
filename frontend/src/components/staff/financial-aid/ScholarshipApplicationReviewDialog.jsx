"use client";

import { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Slide from "@mui/material/Slide";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import FinancialNeedSummary from "./FinancialNeedSummary";
import ScoringSidebar from "./ScoringSidebar";

function EligibilityMatchChip({ passes }) {
  if (passes === true) {
    return (
      <Chip
        size="small"
        icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
        label="Meets"
        sx={{ bgcolor: ST.colors.successLight, color: ST.colors.success, fontWeight: 700 }}
      />
    );
  }
  if (passes === false) {
    return (
      <Chip
        size="small"
        icon={<CancelIcon sx={{ fontSize: "14px !important" }} />}
        label="Does not meet"
        sx={{ bgcolor: ST.colors.errorLight, color: ST.colors.error, fontWeight: 700 }}
      />
    );
  }
  return (
    <Chip
      size="small"
      icon={<HelpOutlineIcon sx={{ fontSize: "14px !important" }} />}
      label="Review manually"
      sx={{ bgcolor: ST.colors.bg, fontWeight: 600 }}
    />
  );
}

export default function ScholarshipApplicationReviewDialog({
  open,
  onClose,
  detail,
  loading = false,
  onScore,
  scoreOpen = false,
  onScoreClose,
  scoring,
  documentPreviewBase = "/sis-lms/financial-aid/triage/applications",
}) {
  const [docPreview, setDocPreview] = useState(null);

  if (!open) return null;

  const essay = detail?.essay_scrubbed || detail?.form_data?.essay_merit || detail?.form_data?.talent_statement;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={scoreOpen ? "xl" : "lg"}
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: scoreOpen ? "min(1200px, calc(100vw - 32px))" : undefined,
            transition: "max-width 0.25s ease",
          },
        }}
      >
        <DialogTitle>
          Application review
          {scoreOpen && (
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
              Read the application on the left, then tap 1–5 for each criterion in the scorecard on the right.
            </Typography>
          )}
          {detail?.mapping && (
            <Typography variant="subtitle2" display="block" sx={{ mt: 0.5, fontWeight: 700 }}>
              {detail.mapping.student_name} ({detail.mapping.student_number})
            </Typography>
          )}
          <Typography variant="caption" display="block" color="text.secondary">
            {detail?.scholarship_name}
            {detail?.anonymized_id ? ` · ${detail.anonymized_id}` : ""}
          </Typography>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            display: "flex",
            flexDirection: { xs: scoreOpen ? "column" : "row", sm: "row" },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflowY: "auto",
              p: 3,
              transition: "flex 0.25s ease",
            }}
          >
          {loading || !detail ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <FinancialNeedSummary summary={detail.financial_need_summary} />

              {detail.eligibility_comparison && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy, mb: 1 }}>
                    Eligibility vs programme requirements
                  </Typography>
                  <Alert
                    severity={detail.eligibility_comparison.overall_pass ? "success" : "warning"}
                    sx={{ mb: 2 }}
                  >
                    {detail.eligibility_comparison.overall_pass
                      ? "Applicant meets configured requirements on current SIS data."
                      : "One or more requirements are not met — review before scoring."}
                  </Alert>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: ST.colors.bg }}>
                          <TableCell sx={{ fontWeight: 700 }}>Criterion</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Required</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Applicant</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Match</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(detail.eligibility_comparison.checks || []).map((row, idx) => (
                          <TableRow key={`${row.criterion}-${idx}`}>
                            <TableCell>{row.criterion}</TableCell>
                            <TableCell>{row.required}</TableCell>
                            <TableCell>{row.actual}</TableCell>
                            <TableCell align="center">
                              <EligibilityMatchChip passes={row.passes} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    Academic profile
                  </Typography>
                  {detail.objective_metrics &&
                    Object.entries(detail.objective_metrics)
                      .filter(([k]) => k !== "need_index")
                      .map(([k, v]) => (
                      <Typography key={k} variant="body2">
                        <strong>{k.replace(/_/g, " ")}:</strong> {v ?? "—"}
                      </Typography>
                    ))}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">
                    Application responses
                  </Typography>
                  {detail.form_data &&
                    Object.entries(detail.form_data)
                      .filter(([k, v]) => {
                        if (["supporting_documents", "essay_merit", "talent_statement", "personal_statement_ack"].includes(k)) {
                          return false;
                        }
                        return v !== null && v !== "" && typeof v !== "object";
                      })
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <Typography key={k} variant="body2">
                          <strong>{k.replace(/_/g, " ")}:</strong> {String(v)}
                        </Typography>
                      ))}
                </Grid>
              </Grid>

              {essay && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Personal statement / essay
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {essay}
                  </Typography>
                </>
              )}

              {detail.supporting_documents?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Supporting documents ({detail.supporting_documents.length})
                  </Typography>
                  <List dense sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 1.5 }}>
                    {detail.supporting_documents.map((d, i) => (
                      <ListItem
                        key={d.storage_key || `${d.name}-${i}`}
                        secondaryAction={
                          d.previewable ? (
                            <Button
                              size="small"
                              startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                              onClick={() =>
                                setDocPreview({
                                  path: `${documentPreviewBase}/${detail.application_id}/documents/${encodeURIComponent(d.storage_key)}`,
                                  name: d.name,
                                  mime: d.mime,
                                })
                              }
                              sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                              Preview
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Re-upload required
                            </Typography>
                          )
                        }
                      >
                        <ListItemText primary={d.name} secondary={d.size_mb != null ? `${d.size_mb} MB` : null} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
          </Box>

          <Slide direction="left" in={scoreOpen} mountOnEnter unmountOnExit>
            <Box sx={{ display: "flex" }}>
              <ScoringSidebar
                open={scoreOpen}
                onClose={onScoreClose}
                applicantName={
                  scoring?.applicantName ||
                  detail?.mapping?.student_name ||
                  detail?.student_name
                }
                scholarshipName={detail?.scholarship_name}
                weights={scoring?.weights}
                scores={scoring?.scores || { academic: "", need: "", lead: "" }}
                onScoresChange={scoring?.onScoresChange}
                composite={scoring?.composite}
                busy={scoring?.busy}
                onSubmit={scoring?.onSubmit}
              />
            </Box>
          </Slide>
        </DialogContent>
        <DialogActions>
          {onScore && !scoreOpen && (
            <Button
              variant="contained"
              startIcon={<RateReviewIcon />}
              onClick={onScore}
              sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600 }}
            >
              Score application
            </Button>
          )}
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentPreviewDialog
        open={Boolean(docPreview)}
        onClose={() => setDocPreview(null)}
        previewPath={docPreview?.path}
        fileName={docPreview?.name}
        mime={docPreview?.mime}
      />
    </>
  );
}
