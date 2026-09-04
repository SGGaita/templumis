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
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/lib/language-context";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ScienceIcon from "@mui/icons-material/Science";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const modules = [
    {
      title: t.home.modules.enrollment.title,
      description: t.home.modules.enrollment.description,
      icon: <SchoolIcon sx={{ fontSize: 48, color: "primary.main" }} />,
    },
    {
      title: t.home.modules.financial.title,
      description: t.home.modules.financial.description,
      icon: <AccountBalanceIcon sx={{ fontSize: 48, color: "secondary.main" }} />,
    },
    {
      title: t.home.modules.support.title,
      description: t.home.modules.support.description,
      icon: <SupportAgentIcon sx={{ fontSize: 48, color: "primary.main" }} />,
    },
    {
      title: t.home.modules.grants.title,
      description: t.home.modules.grants.description,
      icon: <ScienceIcon sx={{ fontSize: 48, color: "secondary.main" }} />,
    },
    {
      title: t.home.modules.rankings.title,
      description: t.home.modules.rankings.description,
      icon: <EmojiEventsIcon sx={{ fontSize: 48, color: "primary.main" }} />,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar
          sx={{
            minHeight: 88,
            py: 1.5,
            px: { xs: 2, sm: 3 },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <BrandLogo height={64} format="png" onClick={() => router.push("/")} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto", flexShrink: 0 }}>
            <LanguageToggle />
            <Button variant="text" onClick={() => router.push("/documentation")} sx={{ fontWeight: 600 }}>
              {t.common.documentation}
            </Button>
            <Button
              variant="outlined"
              startIcon={<LoginIcon />}
              onClick={() => router.push("/login")}
            >
              {t.home.nav.loginBtn}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PersonAddIcon />}
              onClick={() => router.push("/signup")}
            >
              {t.home.nav.signupBtn}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          bgcolor: BRAND.navy,
          color: "white",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <BrandLogo
              height={96}
              format="white"
              align="center"
              sx={{ alignItems: "center", width: "100%", maxWidth: 420 }}
            />
          </Box>
          <Typography variant="h5" component="p" sx={{ opacity: 0.92, fontWeight: 500, maxWidth: 520, mx: "auto" }}>
            {t.home.hero.tagline}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400, mt: 1 }}>
            {t.home.hero.subtitle}
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 2, opacity: 0.75, maxWidth: 600, mx: "auto" }}
          >
            {t.home.hero.description}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" textAlign="center" gutterBottom>
          {t.home.modules.heading}
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
        >
          {t.home.modules.subheading}
        </Typography>

        <Grid container spacing={3}>
          {modules.map((mod) => (
            <Grid item xs={12} sm={6} md={4} key={mod.title}>
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
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
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

      <SiteFooter />
    </Box>
  );
}
