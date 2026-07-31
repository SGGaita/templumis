"use client";

import { Card, CardContent, CardActions, Typography, Button, Box, Badge } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ST } from "@/lib/staffTheme";

export default function SupportResourceCard({ icon, title, description, badge, color, onClick }) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <Box
            sx={{
              bgcolor: color || ST.colors.primary,
              borderRadius: 1.5,
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Badge badgeContent={badge} color="error">
              {icon}
            </Badge>
          </Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={onClick}
          sx={{
            borderColor: color || ST.colors.primary,
            color: color || ST.colors.primary,
            "&:hover": {
              borderColor: color || ST.colors.primary,
              bgcolor: `${color || ST.colors.primary}10`,
            },
          }}
        >
          Access
        </Button>
      </CardActions>
    </Card>
  );
}
