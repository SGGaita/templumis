"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";

export default function FinancialNeedSummary({ summary }) {
  if (!summary?.is_need_based) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <AccountBalanceWalletIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy }}>
          Financial need & status
        </Typography>
      </Stack>
      <Alert
        severity={
          summary.documents_verified
            ? "success"
            : summary.fee_balance > 0
              ? "warning"
              : "info"
        }
        sx={{ mb: 2 }}
      >
        {summary.overall_status}
      </Alert>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: ST.colors.bg }}>
              <TableCell sx={{ fontWeight: 700 }}>Indicator</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>What it means</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(summary.rows || []).map((row) => (
              <TableRow key={row.indicator}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {row.indicator}
                  </Typography>
                </TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.status}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
