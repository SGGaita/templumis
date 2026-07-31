"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import { checkScholarshipEligibility } from "@/lib/scholarships";
import SmartAlertBanner from "./SmartAlertBanner";

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function ApplicationDashboardHub({ profile, user }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const s = profile?.student ?? {};
  const stats = profile?.statistics ?? {};

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ws = await apiFetch("/sis-lms/scholarships/applications/workspace");
        if (!cancelled) setWorkspace(ws);
      } catch {
        if (!cancelled) setWorkspace({ eligible: [], in_progress: [], submitted: [], alerts: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const eligible = (workspace?.eligible || []).filter(
    (x) => checkScholarshipEligibility(x, profile).eligible
  );
  const inProgress = workspace?.in_progress || [];
  const submitted = workspace?.submitted || [];

  return (
    <Paper
      elevation={0}
      sx={{ mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyMuted} 100%)`,
        }}
      >
        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.65)", letterSpacing: 1 }}>
          Scholarship application portal
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: "#fff", mt: 0.5 }}>
          {s.full_name || user?.full_name}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
          {[
            { label: "Student ID", value: s.student_id || user?.student_registration_number },
            { label: "Major", value: s.major },
            { label: "GPA", value: stats.gpa != null ? stats.gpa.toFixed(2) : "—" },
            {
              label: "Credits earned",
              value:
                stats.total_credits_completed ??
                s.credits_completed ??
                s.credit_hours_earned ??
                "—",
            },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block" }}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: "#fff" }}>
                {value ?? "—"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        <SmartAlertBanner alerts={workspace?.alerts || []} />

        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} sx={{ color: BRAND.teal }} />
          </Box>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                minHeight: 40,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
              }}
            >
              <Tab label={`Eligible / Open (${eligible.length})`} />
              <Tab label={`In Progress (${inProgress.length})`} />
              <Tab label={`Submitted (${submitted.length})`} />
            </Tabs>

            <TabPanel value={tab} index={0}>
              {eligible.length === 0 ? (
                <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                  No new matches right now.{" "}
                  <Button size="small" onClick={() => router.push("/student/scholarships/available")}>
                    Browse catalog
                  </Button>
                </Typography>
              ) : (
                eligible.slice(0, 5).map((sch) => (
                  <Box
                    key={sch.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1.5,
                      borderBottom: `1px solid ${ST.colors.border}`,
                      gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {sch.scholarship_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                        {sch.type} · KES {Number(sch["amount_(kes)"] || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 700, flexShrink: 0 }}
                      onClick={() =>
                        router.push(`/student/scholarships/apply/${encodeURIComponent(sch.id)}`)
                      }
                    >
                      Start
                    </Button>
                  </Box>
                ))
              )}
              {eligible.length > 5 && (
                <Button
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 1, textTransform: "none" }}
                  onClick={() => router.push("/student/scholarships/available")}
                >
                  View all {eligible.length} opportunities
                </Button>
              )}
            </TabPanel>

            <TabPanel value={tab} index={1}>
              {inProgress.length === 0 ? (
                <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                  No drafts yet. Start an application from Eligible / Open.
                </Typography>
              ) : (
                inProgress.map((app) => {
                  const name =
                    app.scholarship_details?.scholarship_name ||
                    app.scholarship_name ||
                    app.schol_id;
                  const pct = app.progress_pct ?? 0;
                  return (
                    <Box key={app.application_id || app.schol_id} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {name}
                        </Typography>
                        <Chip size="small" icon={<EditNoteIcon />} label={`${pct}%`} />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          mb: 1,
                          "& .MuiLinearProgress-bar": { bgcolor: BRAND.teal },
                        }}
                      />
                      <Button
                        size="small"
                        sx={{ textTransform: "none", fontWeight: 600 }}
                        onClick={() =>
                          router.push(
                            `/student/scholarships/apply/${encodeURIComponent(app.schol_id)}`
                          )
                        }
                      >
                        Continue application
                      </Button>
                    </Box>
                  );
                })
              )}
            </TabPanel>

            <TabPanel value={tab} index={2}>
              {submitted.length === 0 ? (
                <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                  No submitted applications yet.
                </Typography>
              ) : (
                submitted.map((app) => {
                  const name =
                    app.scholarship_details?.scholarship_name ||
                    app.scholarship_name ||
                    app.schol_id;
                  const workflow = app.workflow_status || app.status || "Submitted";
                  return (
                    <Box
                      key={app.application_id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1.5,
                        borderBottom: `1px solid ${ST.colors.border}`,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
                          Submitted {app.applied_date || "—"}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        icon={<SendIcon sx={{ fontSize: 14 }} />}
                        label={workflow}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  );
                })
              )}
            </TabPanel>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Button
          startIcon={<EmojiEventsIcon />}
          variant="outlined"
          onClick={() => router.push("/student/scholarships/available")}
          sx={{ textTransform: "none", fontWeight: 700, borderColor: BRAND.teal, color: BRAND.teal }}
        >
          Browse full scholarship catalog
        </Button>
      </Box>
    </Paper>
  );
}
