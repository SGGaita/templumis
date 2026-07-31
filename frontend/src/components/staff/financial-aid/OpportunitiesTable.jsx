"use client";

import { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";

const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

const workflowStyle = {
  published: { label: "Published", color: "success" },
  pending_approval: { label: "Pending approval", color: "warning" },
  draft: { label: "Draft", color: "default" },
  closed: { label: "Closed", color: "error" },
};

export default function OpportunitiesTable({ kind, title, configurePath }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const apiPath =
    kind === "grant"
      ? "/sis-lms/grants/programs?admin=1"
      : "/sis-lms/scholarships/programs?admin=1&kind=scholarship";

  useEffect(() => {
    setLoading(true);
    apiFetch(apiPath)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiPath]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.scholarship_name || "").toLowerCase().includes(q) ||
        String(r.id || "").toLowerCase().includes(q) ||
        String(r.type || "").toLowerCase().includes(q) ||
        String(r.workflow_status || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

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
        Created opportunities from the database — {filtered.length} programme{filtered.length === 1 ? "" : "s"}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${ST.colors.border}` }}>
          <TextField
            size="small"
            placeholder="Search name, ID, type, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 320 }}
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>ID</TableCell>
                  <TableCell sx={headSx}>Name</TableCell>
                  <TableCell sx={headSx}>Type</TableCell>
                  <TableCell sx={headSx}>Value</TableCell>
                  <TableCell sx={headSx}>Slots</TableCell>
                  <TableCell sx={headSx}>Workflow</TableCell>
                  <TableCell sx={headSx}>Student status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: ST.colors.textSecondary }}>
                      No opportunities yet.{" "}
                      {configurePath && (
                        <Typography component="span" variant="body2">
                          Use Configure to create one.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const wf = workflowStyle[r.workflow_status] || workflowStyle.draft;
                    return (
                      <TableRow key={r.id || r.db_id} hover>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.id}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{r.scholarship_name}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{r.type}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{fmtKES(r["amount_(kes)"])}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {r.slots_filled ?? 0} / {r.slots ?? 0}
                        </TableCell>
                        <TableCell>
                          <Chip label={wf.label} size="small" color={wf.color} sx={{ height: 22, fontSize: 11 }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={String(r.status || "—")}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: 11 }}
                          />
                        </TableCell>
                      </TableRow>
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
