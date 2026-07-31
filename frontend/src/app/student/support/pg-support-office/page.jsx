"use client";

import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailIcon from "@mui/icons-material/Email";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import PgSupportLayout, { usePgJourney } from "@/components/student/PgSupportLayout";

const PG_SUPPORT_EMAIL = "pgsupport@templumis.ac";

export default function PgSupportOfficePage() {
  const { journeyData } = usePgJourney();
  const cases = journeyData?.pg_academic_support || [];

  return (
    <PgSupportLayout
      title="PG Support Office"
      subtitle="Graduate school academic support, challenges, and intervention tracking"
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <SupportAgentIcon sx={{ color: BRAND.navy, fontSize: 36, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Graduate School</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Academic coaching, probation guidance, ethics referrals, and liaison with supervisors.
            </Typography>
            <Typography variant="body2"><strong>Email:</strong> {PG_SUPPORT_EMAIL}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}><strong>Phone:</strong> +254 700 000 200</Typography>
            <Button startIcon={<EmailIcon />} href={`mailto:${PG_SUPPORT_EMAIL}`} variant="contained" sx={{ bgcolor: BRAND.navy, textTransform: "none", fontWeight: 600 }}>
              Contact support office
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Active support cases</Typography>
            {cases.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No open support cases — you're in good standing.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: ST.colors.bg }}>
                    <TableCell sx={{ fontWeight: 700 }}>Challenge</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Officer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Next review</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cases.map((row, i) => (
                    <TableRow key={row.case_id || i}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{row.challenge_title || row.service}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.description?.slice(0, 80)}{(row.description?.length || 0) > 80 ? "…" : ""}</Typography>
                      </TableCell>
                      <TableCell>{row.challenge_type || row.service}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.priority || row.severity || "Normal"} sx={{ fontSize: 10 }} />
                      </TableCell>
                      <TableCell>{row.support_officer || row.provider}</TableCell>
                      <TableCell>{row.next_review || row.next_session || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </PgSupportLayout>
  );
}
