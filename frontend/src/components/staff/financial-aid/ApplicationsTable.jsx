"use client";

import { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";
import { apiFetch } from "@/lib/api";
import GrantReviewDialog from "@/components/staff/financial-aid/GrantReviewDialog";

const statusConfig = {
  active: { label: "Awarded / Approved", bg: ST.colors.successLight, color: ST.colors.success },
  pending: { label: "Under review", bg: ST.colors.warningLight, color: ST.colors.warning },
  draft: { label: "Draft", bg: ST.colors.bg, color: ST.colors.textSecondary },
  suspended: { label: "Rejected", bg: ST.colors.errorLight, color: ST.colors.error },
};

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const tabFilters = ["all", "active", "pending", "draft"];

export default function ApplicationsTable({ kind, title, nameField = "scholarship_name", readOnly = false }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ applications: [], stats: {} });
  const [reviewTarget, setReviewTarget] = useState(null);

  const reload = () => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}&limit=500` : "?limit=500";
    apiFetch(`${apiPath}${q}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const apiPath =
    kind === "grant"
      ? "/sis-lms/grants/applications/staff"
      : "/sis-lms/scholarships/applications/staff";

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, search]);

  const applications = data.applications || [];
  const stats = data.stats || {};

  const filtered = useMemo(() => {
    const statusKey = tabFilters[tab];
    return applications.filter((s) => statusKey === "all" || s.status === statusKey);
  }, [applications, tab]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headSx = {
    fontWeight: 600,
    fontSize: 12,
    color: ST.colors.textSecondary,
    bgcolor: ST.colors.bg,
    borderBottom: `1px solid ${ST.colors.border}`,
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Submitted applications and status (live from database)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: "Total", value: stats.total_applications ?? 0 },
          { label: "Pending", value: stats.pending_review ?? 0 },
          { label: "Awarded / approved", value: stats.active_recipients ?? 0 },
          { label: "Drafts", value: stats.drafts ?? 0 },
        ].map((c) => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Paper elevation={0} sx={{ p: 2, border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={800}>
                {loading ? "—" : c.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {c.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ px: 2, pt: 1, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ minHeight: 44 }}>
            <Tab label="All" sx={{ textTransform: "none", fontSize: 13 }} />
            <Tab label={`Approved (${stats.active_recipients ?? 0})`} sx={{ textTransform: "none", fontSize: 13 }} />
            <Tab label={`Pending (${stats.pending_review ?? 0})`} sx={{ textTransform: "none", fontSize: 13 }} />
            <Tab label={`Drafts (${stats.drafts ?? 0})`} sx={{ textTransform: "none", fontSize: 13 }} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: 260, mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>{kind === "grant" ? "Grant" : "Scholarship"}</TableCell>
                    <TableCell sx={headSx}>Student</TableCell>
                    {kind === "grant" && <TableCell sx={headSx}>Project</TableCell>}
                    <TableCell sx={headSx}>Amount</TableCell>
                    <TableCell sx={headSx}>Applied</TableCell>
                    <TableCell sx={headSx}>Status</TableCell>
                    {kind === "grant" && !readOnly && <TableCell sx={headSx} align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={kind === "grant" ? (readOnly ? 6 : 7) : 5} align="center" sx={{ py: 5, color: ST.colors.textSecondary }}>
                        No applications submitted yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((s) => {
                      const sc = statusConfig[s.status] || statusConfig.pending;
                      return (
                        <TableRow key={s.id || s.application_id} hover>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{s[nameField]}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: ST.colors.primary }}>
                                {(s.recipient || "?").charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
                                  {s.recipient}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {s.student_id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          {kind === "grant" && (
                            <TableCell sx={{ fontSize: 12, maxWidth: 200 }}>{s.project_title || "—"}</TableCell>
                          )}
                          <TableCell sx={{ fontSize: 13 }}>{fmtKES(s.amount)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{s.applied || "—"}</TableCell>
                          <TableCell>
                            <Chip label={sc.label} size="small" sx={{ height: 22, fontSize: 10, bgcolor: sc.bg, color: sc.color }} />
                          </TableCell>
                          {kind === "grant" && !readOnly && (
                            <TableCell align="right">
                              {s.status === "pending" && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => setReviewTarget(s)}
                                  sx={{ textTransform: "none", fontWeight: 600, bgcolor: BRAND.teal, fontSize: 11 }}
                                >
                                  Review
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Paper>

      {kind === "grant" && !readOnly && (
        <GrantReviewDialog
          application={reviewTarget}
          open={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          onUpdated={reload}
        />
      )}
    </Box>
  );
}
