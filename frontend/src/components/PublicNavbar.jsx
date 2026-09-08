"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";

/**
 * Marketing / public top navbar with a desktop link row and a mobile drawer menu.
 */
export default function PublicNavbar({ showSignup = false }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (path) => {
    setMobileOpen(false);
    router.push(path);
  };

  const desktopLinks = (
    <>
      <Button
        variant="outlined"
        startIcon={<LoginIcon />}
        onClick={() => go("/login")}
      >
        {t.home.nav.loginBtn}
      </Button>
      {showSignup ? (
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PersonAddIcon />}
          onClick={() => go("/signup")}
        >
          {t.home.nav.signupBtn}
        </Button>
      ) : null}
    </>
  );

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 88 },
            py: { xs: 1, sm: 1.5 },
            px: { xs: 1.5, sm: 3 },
            justifyContent: "space-between",
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ minWidth: 0, flexShrink: 1, overflow: "hidden", display: { xs: "none", sm: "block" } }}>
            <BrandLogo height={56} format="png" onClick={() => go("/")} />
          </Box>
          <Box sx={{ minWidth: 0, flexShrink: 1, overflow: "hidden", display: { xs: "block", sm: "none" } }}>
            <BrandLogo height={36} format="png" onClick={() => go("/")} />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1.5 },
              ml: "auto",
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: { xs: "none", sm: "flex" } }}>
              <LanguageToggle />
            </Box>
            <Box sx={{ display: { xs: "flex", sm: "none" } }}>
              <LanguageToggle iconOnly />
            </Box>

            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1.5,
              }}
            >
              {desktopLinks}
            </Box>

            <IconButton
              edge="end"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
              aria-label={t.home.nav.openMenu}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { md: "none" },
          "& .MuiDrawer-paper": {
            width: "min(320px, 88vw)",
            boxSizing: "border-box",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <BrandLogo height={36} format="png" onClick={() => go("/")} />
          <IconButton onClick={() => setMobileOpen(false)} aria-label={t.home.nav.closeMenu}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ px: 1, py: 1.5 }}>
          <ListItemButton onClick={() => go("/login")} sx={{ borderRadius: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary={t.home.nav.loginBtn} />
          </ListItemButton>
          {showSignup ? (
            <ListItemButton onClick={() => go("/signup")} sx={{ borderRadius: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonAddIcon />
              </ListItemIcon>
              <ListItemText primary={t.home.nav.signupBtn} />
            </ListItemButton>
          ) : null}
        </List>
        <Divider />
        <Box sx={{ px: 2, py: 2 }}>
          <LanguageToggle />
        </Box>
      </Drawer>
    </>
  );
}
