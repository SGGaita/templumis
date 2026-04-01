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

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {ACTION_ICONS[activity.action] || <EditIcon fontSize="small" />}
            <Chip
              label={getActionLabel(activity.action)}
              size="small"
              color={ACTION_COLORS[activity.action] || "default"}
              variant="outlined"
            />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {activity.user?.full_name || "Unknown"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activity.user?.email || "—"}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={activity.entity_type.replace(/_/g, " ")}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {formatTimestamp(activity.created_at)}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 2, bgcolor: "grey.50" }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Activity Details
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mb: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Entity ID</Typography>
                  <Typography variant="body2">{activity.entity_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2">
                    {new Date(activity.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              {activity.details && Object.keys(activity.details).length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, mb: 0.5 }}>
                    Additional Information
                  </Typography>
                  <Paper sx={{ p: 1.5, bgcolor: "background.paper" }}>
                    <pre style={{ margin: 0, fontSize: "0.75rem", overflow: "auto" }}>
                      {JSON.stringify(activity.details, null, 2)}
                    </pre>
                  </Paper>
                </>
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
        <LinearProgress />
      </InstitutionAdminLayout>
    );
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Activity Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit trail of all actions performed in your institution
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            select
            label="Filter by Action"
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            {uniqueActions.map((action) => (
              <MenuItem key={action} value={action}>
                {action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            Total: {total} activities
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Action</TableCell>
              <TableCell>Performed By</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
            {activities.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No activities found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>
    </InstitutionAdminLayout>
  );
}
