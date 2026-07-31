"use client";

import { useState } from "react";
import { Paper, Typography, Box, Alert, IconButton, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import ErrorIcon from "@mui/icons-material/Error";

export default function AlertsNotifications({ alerts = [] }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const handleDismiss = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "error":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.includes(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Active Alerts & Notifications
      </Typography>
      <Box display="flex" flexDirection="column" gap={1.5}>
        {visibleAlerts.map((alert) => (
          <Collapse key={alert.id} in={!dismissedAlerts.includes(alert.id)}>
            <Alert
              severity={alert.severity || "info"}
              icon={getSeverityIcon(alert.severity)}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Typography variant="body2" fontWeight={600}>
                {alert.title}
              </Typography>
              <Typography variant="body2">{alert.message}</Typography>
            </Alert>
          </Collapse>
        ))}
      </Box>
    </Paper>
  );
}
