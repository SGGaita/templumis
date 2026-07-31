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
import HandshakeIcon from "@mui/icons-material/Handshake";
import HistoryIcon from "@mui/icons-material/History";
import BrandLogo from "@/components/BrandLogo";
import { apiFetch } from "@/lib/api";
import { isSponsorUser } from "@/lib/sponsorPermissions";
import { ST } from "@/lib/staffTheme";

const drawerWidth = 260;

const NAV_ITEMS = [
  { text: "Sponsorship Requests", href: "/sponsor/requests", icon: HandshakeIcon, badgeKey: "pending" },
  { text: "Past Requests", href: "/sponsor/past", icon: HistoryIcon },
];

function SponsorLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/auth/me")
      .then((userData) => {
        if (cancelled) return;
        if (!isSponsorUser(userData)) {
          router.replace("/login");
          return;
        }
        setUser(userData);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch("/sis-lms/grants/sponsorship-requests/dashboard")
      .then((data) => { if (!cancelled) setPendingCount(data.pending_count); })
      .catch((e) => {
        if (!cancelled && String(e.message || "").includes("403")) setAccessDenied(true);
      });
    return () => { cancelled = true; };
  }, [user]);

  const currentPage = NAV_ITEMS.find((item) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  ) || (pathname.startsWith("/sponsor/requests/") ? NAV_ITEMS[0] : null);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#1e1b4b" }}>
      <Box sx={{ px: 2, py: 2 }}>
        <BrandLogo height={44} format="white" subtitle="Sponsor portal" subtitleTone="dark" />
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1 }}>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              || (item.href === "/sponsor/requests" && pathname.startsWith("/sponsor/requests/"));
            const Icon = item.icon;
            const badge = item.badgeKey === "pending" ? pendingCount : null;
            return (
              <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => router.push(item.href)}
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    px: 1.5,
                    bgcolor: active ? "rgba(124,58,237,0.35)" : "transparent",
                    "&:hover": { bgcolor: active ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.06)" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: active ? "white" : "rgba(255,255,255,0.65)" }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? "white" : "rgba(255,255,255,0.75)",
                    }}
                  />
                  {badge != null && badge > 0 && (
                    <Chip label={badge} size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#EF4444", color: "white" }} />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      {user && (
        <>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "#7c3aed", fontSize: 14 }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
                Faculty sponsor / PI
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
        <Typography variant="body1" color="text.secondary">Loading sponsor portal...</Typography>
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: ST.colors.bg, p: 3 }}>
        <Box sx={{ maxWidth: 420, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>No sponsorship requests yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            When a student lists your email on a PI grant application, requests will appear under Sponsorship Requests.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Signed in as <strong>{user.email}</strong>
          </Typography>
        </Box>
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
              {currentPage?.text || "Sponsor"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Review and respond to student sponsorship requests
            </Typography>
          </Box>
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#7c3aed", fontSize: 14 }}>
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

export default function SponsorLayout({ children }) {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography variant="body1" color="text.secondary">Loading...</Typography>
      </Box>
    }>
      <SponsorLayoutInner>{children}</SponsorLayoutInner>
    </Suspense>
  );
}
