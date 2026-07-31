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
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import DomainAddIcon from "@mui/icons-material/DomainAdd";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import GlobalAdminLayout from "@/components/GlobalAdminLayout";

const actionIcons = {
  create_institution: { icon: <BusinessIcon />, color: "primary", label: "Institution Created" },
  update_institution: { icon: <EditIcon />, color: "info", label: "Institution Updated" },
  add_domain: { icon: <DomainAddIcon />, color: "secondary", label: "Domain Added" },
  remove_domain: { icon: <DomainAddIcon />, color: "error", label: "Domain Removed" },
  create_institution_admin: { icon: <PersonAddIcon />, color: "success", label: "Admin Created" },
  default: { icon: <SettingsIcon />, color: "default", label: "Action" },
};

function ActivityRow({ activity }) {
  const [open, setOpen] = useState(false);
  const actionConfig = actionIcons[activity.action] || actionIcons.default;
  
  const formatTimestamp = (isoString) => {
    // Parse the ISO string and ensure it's treated as UTC
    const date = new Date(isoString + (isoString.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Chip
            icon={actionConfig.icon}
            label={actionConfig.label}
            color={actionConfig.color}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2">{activity.entity_type}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{activity.user?.full_name || "System"}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {activity.user?.email}
          </Typography>
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
            <Box sx={{ py: 2, px: 2, bgcolor: "grey.50", borderRadius: 1, my: 1 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Details
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="caption" color="text.secondary" component="div">
                  <strong>Entity ID:</strong> {activity.entity_id}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                  <strong>Timestamp:</strong> {new Date(activity.created_at + (activity.created_at.includes('Z') ? '' : 'Z')).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </Typography>
                {activity.details && Object.keys(activity.details).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" fontWeight={600}>Additional Info:</Typography>
                    <Box component="pre" sx={{ 
                      fontSize: "0.7rem", 
                      bgcolor: "background.paper", 
                      p: 1, 
                      borderRadius: 0.5,
                      mt: 0.5,
                      overflow: "auto"
                    }}>
                      {JSON.stringify(activity.details, null, 2)}
                    </Box>
                  </Box>
                )}
              </Box>
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAction, setFilterAction] = useState("all");

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
      const data = await apiFetch(`/global-admin/activity-log?${params}`, { token });
      setActivities(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, filterAction]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "global_admin") {
      router.push("/global-admin/login");
      return;
    }
    fetchActivities();
  }, [user, authLoading, router, fetchActivities]);

  if (authLoading || loading) {
    return (
      <GlobalAdminLayout>
        <LinearProgress />
      </GlobalAdminLayout>
    );
  }

  return (
    <GlobalAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Activity Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track platform activities
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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
            <MenuItem value="create_institution">Institution Created</MenuItem>
            <MenuItem value="update_institution">Institution Updated</MenuItem>
            <MenuItem value="add_domain">Domain Added</MenuItem>
            <MenuItem value="remove_domain">Domain Removed</MenuItem>
            <MenuItem value="create_institution_admin">Admin Created</MenuItem>
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            {total} {total === 1 ? "activity" : "activities"}
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }} />
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
            {activities.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No activities found. Start creating institutions and adding admins to see activity logs.
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
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </GlobalAdminLayout>
  );
}
