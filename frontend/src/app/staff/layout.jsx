"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import BrandLogo from "@/components/BrandLogo";
import InstitutionNavbarBrand from "@/components/InstitutionNavbarBrand";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { apiFetch } from "@/lib/api";
import { resolveAccountCategory } from "@/lib/auth-routing";
import { isSponsorUser } from "@/lib/sponsorPermissions";
import { ST } from "@/lib/staffTheme";
import {
  buildStaffNavHref,
  isStaffNavItemActive,
  findStaffNavPage,
  getStaffNavGroups,
} from "@/lib/staffNav";
import { roleLabel, isFinancialAidOfficerOnly, isPathAllowedForFinancialAid } from "@/lib/staffPermissions";
import { isStaffPathAllowed, staffHomePath } from "@/lib/institutionModules";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";

const drawerWidth = 260;

function StaffLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [atRiskCount, setAtRiskCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      try {
        const userData = await apiFetch("/auth/me");
        if (cancelled) return;
        setUser(userData);
        if (isSponsorUser(userData)) {
          router.replace("/sponsor/requests");
          return;
        }
        if (resolveAccountCategory(userData) !== "staff") {
          router.replace("/login");
        }
      } catch (error) {
        if (cancelled) return;
        // One retry before giving up
        try {
          const userData = await apiFetch("/auth/me");
          if (cancelled) return;
          setUser(userData);
          if (isSponsorUser(userData)) {
            router.replace("/sponsor/requests");
            return;
          }
          if (resolveAccountCategory(userData) !== "staff") {
            router.replace("/login");
          }
        } catch {
          if (!cancelled) router.replace("/login");
        }
      }
    };

    fetchUser();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!user || isFinancialAidOfficerOnly(user)) return;
    let cancelled = false;
    apiFetch("/sis-lms/at-risk/summary")
      .then((data) => { if (!cancelled) setAtRiskCount(data.total); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || !isFinancialAidOfficerOnly(user)) return;
    if (!isPathAllowedForFinancialAid(pathname)) {
      router.replace(staffHomePath(user));
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    if (!isStaffPathAllowed(pathname, user.enabled_modules)) {
      router.replace(staffHomePath(user));
    }
  }, [user, pathname, router]);

  const { t } = useLanguage();
  const navGroups = user ? getStaffNavGroups(user) : [];
  const currentPage = findStaffNavPage(pathname, searchParams, user);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: ST.sidebar.bg }}>
      <Box sx={{ px: 2, py: 2 }}>
        <BrandLogo
          height={44}
          format="white"
          subtitle={isFinancialAidOfficerOnly(user) ? t.staff.financialAidPortal : t.staff.portal}
          subtitleTone="dark"
        />
      </Box>

      <Divider sx={{ borderColor: ST.sidebar.divider }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1 }}>
        {navGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: ST.sidebar.text, fontWeight: 600, fontSize: 10, letterSpacing: 0.3, px: 1.5, display: "block", mb: 0.5 }}
            >
              {group.label}
            </Typography>
            {group.items.map((item) => {
              const active = isStaffNavItemActive(item, pathname, searchParams);
              const badge = item.badgeKey === "at_risk" && atRiskCount != null ? atRiskCount : item.badge;
              return (
                <ListItem key={`${group.label}-${item.text}`} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => router.push(buildStaffNavHref(item))}
                    sx={{
                      borderRadius: 1.5,
                      py: 1,
                      px: 1.5,
                      bgcolor: active ? ST.sidebar.activeItem : "transparent",
                      "&:hover": { bgcolor: active ? ST.sidebar.activeItem : ST.sidebar.hoverItem },
                      transition: "background 0.15s",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? "white" : ST.sidebar.text,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? "white" : ST.sidebar.text,
                      }}
                    />
                    {badge != null && badge > 0 && (
                      <Chip
                        label={badge}
                        size="small"
                        sx={{ height: 18, fontSize: 10, bgcolor: "#EF4444", color: "white", "& .MuiChip-label": { px: 0.75 } }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: ST.sidebar.divider }} />

      {/* User Profile at bottom */}
      {user && (
        <Box
          sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", "&:hover": { bgcolor: ST.sidebar.hoverItem } }}
          onClick={() => router.push("/staff/profile")}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: ST.colors.primary, fontSize: 14 }}>
            {user.full_name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} sx={{ color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: ST.sidebar.text }}>
              {roleLabel(user.role)}
            </Typography>
          </Box>
          <KeyboardArrowRightIcon sx={{ color: ST.sidebar.text, fontSize: 18 }} />
        </Box>
      )}
    </Box>
  );

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: ST.colors.bg }}>
        <Box sx={{ textAlign: "center" }}>
          <BrandLogo height={40} format="white" sx={{ mx: "auto", mb: 2, alignItems: "center" }} />
          <Typography variant="body1" color="text.secondary">{t.staff.loading}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: ST.colors.bg }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "white",
          color: ST.colors.textPrimary,
          borderBottom: `1px solid ${ST.colors.border}`,
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: "none" } }}>
            <MenuIcon />
          </IconButton>
          <InstitutionNavbarBrand
            name={user.institution_name}
            logoUrl={user.institution_logo_url}
            subtitle={currentPage?.text || t.staff.topbar.dashboard}
            fallbackName={t.staff.portal}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageToggle iconOnly />
            <Tooltip title={t.staff.topbar.notifications}>
              <IconButton>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon sx={{ color: ST.colors.textSecondary }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title={t.staff.topbar.account}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: ST.colors.primary, fontSize: 14 }}>
                  {user.full_name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" fontWeight={600}>{user.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { router.push("/staff/profile"); setAnchorEl(null); }}>
              <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
              {t.staff.topbar.profile}
            </MenuItem>
            <MenuItem onClick={() => { localStorage.removeItem("templumis_token"); router.push("/login"); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              {t.common.logout}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", border: "none" } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: ST.colors.bg,
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function StaffLayout({ children }) {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: ST.colors.bg }}>
        <Typography variant="body1" color="text.secondary">Loading portal...</Typography>
      </Box>
    }>
      <StaffLayoutInner>{children}</StaffLayoutInner>
    </Suspense>
  );
}
