"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ScienceIcon from "@mui/icons-material/Science";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const modules = [
  {
    title: "Enrollment & Student Success",
    description:
      "Monitor and optimize the student journey from admission to graduation with TTD analytics and early-warning dashboards.",
    icon: <SchoolIcon sx={{ fontSize: 48, color: "primary.main" }} />,
  },
  {
    title: "Scholarship & Financial Aid",
    description:
      'Manage the full scholarship lifecycle — fund creation, applications, awarding, and compliance — via the "Finance Bridge."',
    icon: <AccountBalanceIcon sx={{ fontSize: 48, color: "secondary.main" }} />,
  },
  {
    title: "Student Support",
    description:
      "Empower students with milestone tracking, self-service tools, nudge notifications, and academic support ticketing.",
    icon: <SupportAgentIcon sx={{ fontSize: 48, color: "primary.main" }} />,
  },
  {
    title: "Grants & Research",
    description:
      "Track research investment, grant burn rates, publication output mapping, and ethics/IRB compliance alerts.",
    icon: <ScienceIcon sx={{ fontSize: 48, color: "secondary.main" }} />,
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <SchoolIcon sx={{ fontSize: 32, color: "primary.main", mr: 1 }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              TemplumIS
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<LoginIcon />}
            onClick={() => router.push("/login")}
            sx={{ mr: 1 }}
          >
            Login
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          bgcolor: "primary.dark",
          color: "white",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            TemplumIS
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Open Infrastructure Institutional Intelligence Dashboard
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 2, opacity: 0.75, maxWidth: 600, mx: "auto" }}
          >
            Transforming siloed institutional data into a unified intelligence
            layer for enrollment, grants, scholarships, and student success.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" textAlign="center" gutterBottom>
          Core Modules
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
        >
          Four integrated modules covering the complete institutional data
          lifecycle.
        </Typography>

        <Grid container spacing={3}>
          {modules.map((mod) => (
            <Grid item xs={12} sm={6} md={3} key={mod.title}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  p: 2,
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{mod.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {mod.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mod.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: "auto",
          py: 3,
          px: 2,
          bgcolor: "grey.100",
          borderTop: "1px solid",
          borderColor: "grey.300",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} TemplumIS. All rights reserved.
            </Typography>
            <Box sx={{ display: "flex", gap: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}>
                Terms of Service
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}>
                Contact
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
