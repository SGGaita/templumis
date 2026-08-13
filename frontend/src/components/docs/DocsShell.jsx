"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/lib/language-context";
import { BRAND } from "@/lib/brand";
import { DOCS_NAV } from "@/lib/docs/nav";

const DRAWER_WIDTH = 280;

function NavList({ pathname, onNavigate }) {
  return (
    <List dense sx={{ px: 1, py: 1.5 }}>
      {DOCS_NAV.map((item) => {
        const selected = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Box key={item.href} sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={selected}
              onClick={onNavigate}
              sx={{
                borderRadius: 1.5,
                mb: 0.25,
                "&.Mui-selected": {
                  bgcolor: BRAND.tealLight,
                  color: BRAND.navy,
                  "&:hover": { bgcolor: BRAND.tealLight },
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: 14 }}
              />
            </ListItemButton>
            {item.children?.map((child) => (
              <ListItemButton
                key={child.href}
                component={Link}
                href={child.href}
                onClick={onNavigate}
                sx={{ pl: 3, py: 0.4, borderRadius: 1, color: BRAND.slate }}
              >
                <ListItemText
                  primary={child.label}
                  primaryTypographyProps={{ fontSize: 13, color: "text.secondary" }}
                />
              </ListItemButton>
            ))}
          </Box>
        );
      })}
    </List>
  );
}

export default function DocsShell({ title, subtitle, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ height: "100%", bgcolor: "white" }}>
      <Box sx={{ px: 2, py: 2, display: { md: "none" } }}>
        <Typography variant="subtitle2" sx={{ color: BRAND.navy, fontWeight: 700 }}>
          {t.common.documentation}
        </Typography>
      </Box>
      <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: BRAND.pageBg, display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar
          sx={{
            minHeight: 72,
            py: 1,
            px: { xs: 2, sm: 3 },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" }, mr: 0.5 }}
              aria-label="Open documentation menu"
            >
              <MenuIcon />
            </IconButton>
            <BrandLogo height={48} format="png" onClick={() => router.push("/")} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <LanguageToggle />
            <Button variant="outlined" startIcon={<LoginIcon />} onClick={() => router.push("/login")}>
              {t.home.nav.loginBtn}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, width: "100%" }}>
        <Box
          component="nav"
          sx={{
            width: { md: DRAWER_WIDTH },
            flexShrink: 0,
            display: { xs: "none", md: "block" },
            borderRight: `1px solid ${BRAND.border}`,
            bgcolor: "white",
            position: "sticky",
            top: 72,
            alignSelf: "flex-start",
            height: "calc(100vh - 72px)",
            overflowY: "auto",
          }}
        >
          <Typography
            variant="overline"
            sx={{ px: 2.5, pt: 2.5, display: "block", color: BRAND.navyMuted, letterSpacing: 1 }}
          >
            {t.common.documentation}
          </Typography>
          {drawer}
        </Box>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>

        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ bgcolor: BRAND.navy, color: "white", py: { xs: 4, md: 5 } }}>
            <Container maxWidth="md">
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body1" sx={{ opacity: 0.88, maxWidth: 640 }}>
                  {subtitle}
                </Typography>
              )}
            </Container>
          </Box>
          <Container maxWidth="md" sx={{ py: 4, pb: 8 }}>
            {children}
          </Container>
        </Box>
      </Box>

      <Divider />
      <SiteFooter />
    </Box>
  );
}
