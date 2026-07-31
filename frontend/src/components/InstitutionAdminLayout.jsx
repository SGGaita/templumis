"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import DomainIcon from "@mui/icons-material/Domain";
import BusinessIcon from "@mui/icons-material/Business";
import BarChartIcon from "@mui/icons-material/BarChart";
import HistoryIcon from "@mui/icons-material/History";
import ScienceIcon from "@mui/icons-material/Science";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAuth } from "@/lib/auth-context";
import { ST } from "@/lib/staffTheme";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";

const DRAWER_WIDTH = 260;

export default function InstitutionAdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const IA = t.institutionAdmin;

  const NAV_SECTIONS = [
    {
      label: "Overview",
      items: [
        { text: IA.nav.dashboard, icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: "/institution/admin" },
        { text: IA.nav.analytics, icon: <BarChartIcon sx={{ fontSize: 20 }} />, path: "/institution/admin/analytics" },
      ],
    },
    {
      label: "Management",
      items: [
        { text: IA.nav.users, icon: <PeopleIcon sx={{ fontSize: 20 }} />, path: "/institution/admin/users" },
        { text: IA.nav.domains, icon: <DomainIcon sx={{ fontSize: 20 }} />, path: "/institution/admin/domains" },
        { text: IA.nav.profile, icon: <BusinessIcon sx={{ fontSize: 20 }} />, path: "/institution/admin/profile" },
        { text: IA.nav.grants, icon: <ScienceIcon sx={{ fontSize: 20 }} />, path: "/institution/admin/grants" },
      ],
    },
    {
      label: "System",
      items: [
        { text: IA.nav.activity, icon: <HistoryIcon sx={{ fontSize: 20 }} />, path: "/institution/admin/activity" },
      ],
    },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const handleLogout = () => {
    logout();
    router.push("/institution/login");
  };

  const isActive = (path) => {
    if (path === "/institution/admin") return pathname === path;
    return pathname?.startsWith(path);
  };

  const sidebarContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: ST.sidebar.bg }}>
      <Box sx={{ px: 2, py: 2 }}>
        <BrandLogo height={44} format="png" subtitle={IA.portal} subtitleTone="dark" />
        <Typography sx={{ color: "white", fontWeight: 600, fontSize: 12, mt: 1.25, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.institution_name || "Institution"}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: ST.sidebar.divider, mx: 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5, px: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.label} sx={{ mb: 1.5 }}>
            <Typography sx={{ px: 1.5, py: 0.5, fontSize: 10, fontWeight: 600, color: ST.sidebar.text, letterSpacing: 0.4 }}>
              {section.label}
            </Typography>
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItemButton key={item.path} onClick={() => router.push(item.path)}
                  sx={{ borderRadius: 1.5, mb: 0.25, px: 1.5, py: 0.9, minHeight: 0,
                    bgcolor: active ? ST.sidebar.activeItem : "transparent",
                    "&:hover": { bgcolor: active ? ST.sidebar.activeItem : ST.sidebar.hoverItem },
                  }}>
                  <Box sx={{ color: active ? "white" : ST.sidebar.text, mr: 1.5, display: "flex", alignItems: "center" }}>{item.icon}</Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: active ? 600 : 400, color: active ? "white" : ST.sidebar.text }}>
                    {item.text}
                  </Typography>
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: ST.sidebar.divider, mx: 2 }} />

      {/* User card */}
      <Box sx={{ p: 1.5 }}>
        <Box onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: ST.sidebar.hoverItem, cursor: "pointer", "&:hover": { bgcolor: "#263045" } }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: ST.colors.primary, flexShrink: 0 }}>
            {user?.full_name?.charAt(0) || "A"}
          </Avatar>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.full_name || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: 11, color: ST.sidebar.text }}>{IA.portal}</Typography>
          </Box>
          <KeyboardArrowDownIcon sx={{ fontSize: 16, color: ST.sidebar.text, flexShrink: 0 }} />
        </Box>
      </Box>

      <Menu anchorEl={profileMenuAnchor} open={Boolean(profileMenuAnchor)} onClose={() => setProfileMenuAnchor(null)}
        PaperProps={{ elevation: 3, sx: { borderRadius: 2, minWidth: 180, border: `1px solid ${ST.colors.border}` } }}>
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, fontSize: 14, color: ST.colors.error }}>
          <LogoutIcon fontSize="small" /> {t.common.logout}
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: ST.colors.bg }}>
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, bgcolor: ST.sidebar.bg, border: "none", boxSizing: "border-box" } }}>
          {sidebarContent}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, bgcolor: ST.sidebar.bg, border: "none", boxSizing: "border-box" } }}
          open>
          {sidebarContent}
        </Drawer>
      </Box>

      <AppBar position="fixed" elevation={0}
        sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { sm: `${DRAWER_WIDTH}px` }, bgcolor: "white", borderBottom: `1px solid ${ST.colors.border}` }}>
        <Toolbar sx={{ minHeight: "56px !important" }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { sm: "none" }, color: ST.colors.textPrimary }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <LanguageToggle iconOnly />
          <Tooltip title={t.common.notifications}>
            <IconButton sx={{ color: ST.colors.textSecondary }}>
              <NotificationsNoneIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: ST.colors.primary, ml: 1.5, cursor: "pointer" }}
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}>
            {user?.full_name?.charAt(0) || "A"}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: "100vh", mt: "56px" }}>
        {children}
      </Box>
    </Box>
  );
}
