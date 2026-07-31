"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GroupsIcon from "@mui/icons-material/Groups";
import GavelIcon from "@mui/icons-material/Gavel";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { PIPELINE_GUIDE } from "@/lib/scholarshipPipeline";

const GUIDE_ICONS = {
  submitted: SendIcon,
  triage: FactCheckIcon,
  committee: GroupsIcon,
  decision: GavelIcon,
  offer: MailOutlineIcon,
  credited: AccountBalanceIcon,
};

export default function ScholarshipPipelineGuide() {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 2.5,
        border: `1px solid ${ST.colors.border}`,
        background: `linear-gradient(135deg, ${BRAND.navyLight} 0%, ${BRAND.tealLight}55 100%)`,
      }}
    >
      <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND.navy, mb: 0.5 }}>
        How your application moves through the pipeline
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click any application below to expand its live progress. Each scholarship follows these stages.
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: { xs: "flex-start", md: "space-between" },
        }}
      >
        {PIPELINE_GUIDE.map((stage, idx) => {
          const Icon = GUIDE_ICONS[stage.key] || SendIcon;
          return (
            <Box
              key={stage.key}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: { xs: "1 1 45%", md: "1 1 0" },
                minWidth: 100,
                bgcolor: "white",
                borderRadius: 2,
                px: 1.5,
                py: 1,
                border: `1px solid ${ST.colors.border}`,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: BRAND.navy,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <StackRow icon={Icon} label={stage.label} short={stage.short} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

function StackRow({ icon: Icon, label, short }) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Icon sx={{ fontSize: 14, color: BRAND.teal }} />
        <Typography variant="caption" fontWeight={700} noWrap>
          {short}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
        {label}
      </Typography>
    </>
  );
}
