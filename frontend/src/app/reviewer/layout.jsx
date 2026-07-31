"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import Chip from "@mui/material/Chip";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import BrandLogo from "@/components/BrandLogo";
import { apiFetch } from "@/lib/api";
import { resolveAccountCategory } from "@/lib/auth-routing";
import { ST } from "@/lib/staffTheme";

const drawerWidth = 260;

const NAV_ITEMS = [
  { text: "Overview", href: "/reviewer", icon: DashboardIcon, exact: true },
  { text: "New Review Tasks", href: "/reviewer/tasks", icon: AssignmentIcon },
  { text: "My Reviews", href: "/reviewer/history", icon: HistoryIcon },
];

function ReviewerLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/auth/me")
      .then((userData) => {
        if (cancelled) return;
        setUser(userData);
        if (resolveAccountCategory(userData) !== "reviewer") {
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch("/sis-lms/financial-aid/evaluation/reviewer-dashboard")
      .then((data) => { if (!cancelled) setPendingCount(data.pending_count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const currentPage = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: ST.sidebar.bg }}>
      <Box sx={{ px: 2, py: 2 }}>
        <BrandLogo height={44} format="white" subtitle="Reviewer portal" subtitleTone="dark" />
      </Box>
      <Divider sx={{ borderColor: ST.sidebar.divider }} />
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: ST.sidebar.text, fontWeight: 600, fontSize: 10, letterSpacing: 0.3, px: 1.5, display: "block", mb: 0.5 }}
        >
          Reviews
        </Typography>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = item.href === "/reviewer/tasks" ? pendingCount : null;
            return (
              <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => router.push(item.href)}
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    px: 1.5,
                    bgcolor: active ? ST.sidebar.activeItem : "transparent",
                    "&:hover": { bgcolor: active ? ST.sidebar.activeItem : ST.sidebar.hoverItem },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: active ? "white" : ST.sidebar.text }}>
                    <Icon fontSize="small" />
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
                      sx={{ height: 18, fontSize: 10, bgcolor: "#EF4444", color: "white" }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      {user && (
        <>
          <Divider sx={{ borderColor: ST.sidebar.divider }} />
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: ST.colors.primary, fontSize: 14 }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: ST.sidebar.text }}>
                Scholarship reviewer
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: ST.colors.bg }}>
        <Typography variant="body1" color="text.secondary">Loading reviewer portal...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: ST.colors.bg }}>
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: 18 }}>
              {currentPage?.text || "Reviewer"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.institution_name || "Scholarship review"}
            </Typography>
          </Box>
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: ST.colors.primary, fontSize: 14 }}>
                {user.full_name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" fontWeight={600}>{user.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { localStorage.removeItem("templumis_token"); router.push("/login"); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, border: "none" } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8, minHeight: "100vh" }}>
        {children}
      </Box>
    </Box>
  );
}

export default function ReviewerLayout({ children }) {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography variant="body1" color="text.secondary">Loading...</Typography>
      </Box>
    }>
      <ReviewerLayoutInner>{children}</ReviewerLayoutInner>
    </Suspense>
  );
}
