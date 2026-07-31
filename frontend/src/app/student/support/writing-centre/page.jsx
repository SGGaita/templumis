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
import EmailIcon from "@mui/icons-material/Email";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import PgSupportLayout, { usePgJourney } from "@/components/student/PgSupportLayout";

const WRITING_EMAIL = "writing@templumis.ac";

export default function WritingCentrePage() {
  const { journeyData } = usePgJourney();
  const sessions = (journeyData?.pg_academic_support || []).filter((s) =>
    /writing|thesis|academic coaching/i.test(`${s.service} ${s.notes}`)
  );

  return (
    <PgSupportLayout
      title="Writing Centre"
      subtitle="Thesis structure, academic writing, and publication support for postgraduate students"
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
            <MenuBookIcon sx={{ color: BRAND.teal, fontSize: 36, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>PG Writing Lab</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              One-to-one coaching on proposal chapters, literature reviews, methodology, and thesis formatting.
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Email:</strong> {WRITING_EMAIL}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}><strong>Hours:</strong> Mon–Fri, 09:00–16:00</Typography>
            <Button startIcon={<EmailIcon />} href={`mailto:${WRITING_EMAIL}`} variant="contained" sx={{ bgcolor: BRAND.teal, textTransform: "none", fontWeight: 600 }}>
              Book a session
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Your writing support sessions</Typography>
            {sessions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No active writing sessions on file — contact the Writing Centre to schedule your first appointment.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: ST.colors.bg }}>
                    <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Next session</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.service}</TableCell>
                      <TableCell>{row.provider}</TableCell>
                      <TableCell><Chip size="small" label={row.status} sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell>{row.next_session || "—"}</TableCell>
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
