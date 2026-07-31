"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import JourneyTimeline from "@/components/student/JourneyTimeline";
import PgSupportLayout, { usePgJourney } from "@/components/student/PgSupportLayout";

export default function SupervisorPage() {
  const { journeyData } = usePgJourney();
  const pg = journeyData?.pg_research;
  const advisors = journeyData?.advisors || [];

  return (
    <PgSupportLayout
      title="My Supervisor"
      subtitle="Research supervision contacts and current milestone guidance"
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Box sx={{ bgcolor: `${BRAND.navy}12`, borderRadius: 2, p: 1.5 }}>
                <PersonIcon sx={{ color: BRAND.navy, fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{pg?.supervisor || "Supervisor not assigned"}</Typography>
                {pg?.co_supervisor && pg.co_supervisor !== "N/A" && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Co-supervisor: {pg.co_supervisor}
                  </Typography>
                )}
                <Chip size="small" label={pg?.current_stage || journeyData?.student?.current_milestone || "Active"} sx={{ mt: 1, fontWeight: 600 }} />
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary" display="block">Dissertation / capstone</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>{pg?.dissertation_title || "—"}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">Research area</Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>{pg?.research_area || "—"}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">Next review</Typography>
            <Typography variant="body2">{pg?.next_review_date || "Contact your supervisor for scheduling"}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Supervision team</Typography>
            {advisors.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Advisor details will appear once your research tracker is updated.</Typography>
            ) : (
              advisors.filter((a) => /supervisor/i.test(a.role)).map((a) => (
                <Box key={`${a.role}-${a.name}`} sx={{ mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>{a.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.role}</Typography>
                </Box>
              ))
            )}
            {pg?.stage_notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" display="block">Latest notes</Typography>
                <Typography variant="body2">{pg.stage_notes}</Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <JourneyTimeline milestones={journeyData?.milestones || []} journeyData={journeyData} compact />
        </Grid>
      </Grid>
    </PgSupportLayout>
  );
}
