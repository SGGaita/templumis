"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";

export default function SmartAlertBanner({ alerts = [] }) {
  const router = useRouter();
  if (!alerts.length) return null;

  return (
    <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      {alerts.map((a, i) => (
        <Alert
          key={`${a.schol_id}-${i}`}
          severity={a.severity === "error" ? "error" : "warning"}
          action={
            a.schol_id ? (
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  router.push(`/student/scholarships/available?apply=${encodeURIComponent(a.schol_id)}`)
                }
              >
                Resolve
              </Button>
            ) : null
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Action required</AlertTitle>
          {a.message}
        </Alert>
      ))}
    </Box>
  );
}
