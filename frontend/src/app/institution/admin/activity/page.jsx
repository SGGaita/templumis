"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import LinearProgress from "@mui/material/LinearProgress";
import TablePagination from "@mui/material/TablePagination";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DomainIcon from "@mui/icons-material/Domain";
import BusinessIcon from "@mui/icons-material/Business";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";

const ACTION_ICONS = {
  create_user: <PersonAddIcon fontSize="small" />,
  update_user: <EditIcon fontSize="small" />,
  delete_user: <DeleteIcon fontSize="small" />,
  activate_user: <CheckCircleIcon fontSize="small" />,
  deactivate_user: <BlockIcon fontSize="small" />,
  add_domain: <DomainIcon fontSize="small" />,
  update_domain: <EditIcon fontSize="small" />,
  remove_domain: <DeleteIcon fontSize="small" />,
  update_institution_profile: <BusinessIcon fontSize="small" />,
};

const ACTION_COLORS = {
  create_user: "success",
  update_user: "info",
  delete_user: "error",
  activate_user: "success",
  deactivate_user: "warning",
  add_domain: "success",
  update_domain: "info",
  remove_domain: "error",
  update_institution_profile: "info",
};

const ACTION_CHIP_COLORS = {
  create_user:  { bg: ST.colors.successLight, color: ST.colors.success },
  update_user:  { bg: ST.colors.infoLight,    color: ST.colors.info },
  delete_user:  { bg: ST.colors.errorLight,   color: ST.colors.error },
  activate_user:   { bg: ST.colors.successLight, color: ST.colors.success },
  deactivate_user: { bg: ST.colors.warningLight, color: ST.colors.warning },
  add_domain:      { bg: ST.colors.successLight, color: ST.colors.success },
  update_domain:   { bg: ST.colors.infoLight,    color: ST.colors.info },
  remove_domain:   { bg: ST.colors.errorLight,   color: ST.colors.error },
  update_institution_profile: { bg: ST.colors.primaryLight, color: ST.colors.primary },
};

function ActivityRow({ activity }) {
  const [open, setOpen] = useState(false);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActionLabel = (action) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const cc = ACTION_CHIP_COLORS[activity.action] || { bg: ST.colors.bg, color: ST.colors.textSecondary };

  return (
    <>
      <TableRow hover sx={{ "&:hover": { bgcolor: "#F8FAFF" } }}>
        <TableCell sx={{ width: 44 }}>
          <IconButton size="small" onClick={() => setOpen(!open)} sx={{ color: ST.colors.textSecondary }}>
            {open ? <KeyboardArrowUpIcon sx={{ fontSize: 18 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ color: cc.color }}>{ACTION_ICONS[activity.action] || <EditIcon fontSize="small" />}</Box>
            <Chip label={getActionLabel(activity.action)} size="small" sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: cc.bg, color: cc.color }} />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13, color: ST.colors.textPrimary }}>{activity.user?.full_name || "Unknown"}</Typography>
          <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{activity.user?.email || "—"}</Typography>
        </TableCell>
        <TableCell>
          <Chip label={activity.entity_type.replace(/_/g, " ")} size="small"
            sx={{ fontSize: 11, height: 22, bgcolor: ST.colors.bg, color: ST.colors.textSecondary, border: `1px solid ${ST.colors.border}` }} />
        </TableCell>
        <TableCell sx={{ fontSize: 13, color: ST.colors.textSecondary }}>{formatTimestamp(activity.created_at)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}` }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5, color: ST.colors.textPrimary }}>Activity Details</Typography>
              <Box sx={{ display: "flex", gap: 4, mb: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Entity ID</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: ST.colors.textPrimary }}>{activity.entity_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>Full Timestamp</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: ST.colors.textPrimary }}>{new Date(activity.created_at).toLocaleString()}</Typography>
                </Box>
              </Box>
              {activity.details && Object.keys(activity.details).length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mb: 0.5 }}>Details</Typography>
                  <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1.5, border: `1px solid ${ST.colors.border}` }}>
                    <pre style={{ margin: 0, fontSize: "0.75rem", overflow: "auto", color: ST.colors.textPrimary }}>
                      {JSON.stringify(activity.details, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ActivityLogPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
      });
      if (filterAction !== "all") {
        params.append("action", filterAction);
      }
      const data = await apiFetch(`/institution/activity-log?${params}`, { token });
      setActivities(data.items);
      setTotal(data.total);
    } catch (err) {
      setError("Failed to fetch activity log");
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, filterAction]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "institution_admin") {
      router.push("/institution/login");
      return;
    }
    fetchActivities();
  }, [user, authLoading, router, fetchActivities]);

  const uniqueActions = [...new Set(activities.map(a => a.action))];

  if (authLoading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  const headSx = { fontWeight: 600, fontSize: 12, color: ST.colors.textSecondary, bgcolor: ST.colors.bg, borderBottom: `1px solid ${ST.colors.border}`, py: 1.5 };

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>Activity Log</Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>Audit trail of all admin actions performed in your institution</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${ST.colors.border}`, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField select label="Filter by Action" value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }} size="small"
            sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}>
            <MenuItem value="all">All Actions</MenuItem>
            {uniqueActions.map((action) => (
              <MenuItem key={action} value={action}>{action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>{total} total activities</Typography>
        </Box>

        {loading && <LinearProgress sx={{ borderRadius: 0 }} />}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headSx, width: 44 }} />
                <TableCell sx={headSx}>Action</TableCell>
                <TableCell sx={headSx}>Performed By</TableCell>
                <TableCell sx={headSx}>Entity</TableCell>
                <TableCell sx={headSx}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
              {activities.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: ST.colors.textSecondary }}>No activities found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]} sx={{ borderTop: `1px solid ${ST.colors.border}` }} />
      </Paper>
    </InstitutionAdminLayout>
  );
}
