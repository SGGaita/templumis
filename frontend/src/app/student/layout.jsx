"use client";

import { useEffect, useState } from "react";
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
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import MenuIcon from "@mui/icons-material/Menu";
import BrandLogo from "@/components/BrandLogo";
import InstitutionNavbarBrand from "@/components/InstitutionNavbarBrand";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GradeIcon from "@mui/icons-material/Grade";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ScienceIcon from "@mui/icons-material/Science";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PersonIcon from "@mui/icons-material/Person";
import { apiFetch } from "@/lib/api";
import { resolveAccountCategory } from "@/lib/auth-routing";
import { countEligibleScholarships } from "@/lib/scholarships";
import { inferStudentLevel, studentNavGroups } from "@/lib/studentLevel";
import { ST } from "@/lib/staffTheme";
import StudentSidebarSummary from "@/components/student/StudentSidebarSummary";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";

const drawerWidth = 260;

const NAV_ICONS = {
  dashboard: DashboardIcon,
  courses: MenuBookIcon,
  grades: GradeIcon,
  attendance: CalendarMonthIcon,
  financials: AccountBalanceWalletIcon,
  scholarships: EmojiEventsIcon,
  available: CardGiftcardIcon,
  grants: ScienceIcon,
  funding: CardGiftcardIcon,
  support: SupportAgentIcon,
  library: LibraryBooksIcon,
  writing: EditNoteIcon,
  supervisor: PersonIcon,
  pgsupport: SupportAgentIcon,
};

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const TN = t.student.nav;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [journeyMeta, setJourneyMeta] = useState(null);
  const [eligibleScholarships, setEligibleScholarships] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const userData = await apiFetch("/auth/me");
        if (cancelled) return;
        if (resolveAccountCategory(userData) !== "student") {
          router.push("/login");
          return;
        }
        setUser(userData);
      } catch {
        if (!cancelled) router.push("/login");
        return;
      }

      try {
        const [profileData, scholData, journeyExcel, appsData] = await Promise.all([
          apiFetch("/sis-lms/my-profile"),
          apiFetch("/sis-lms/scholarships").catch(() => []),
          apiFetch("/student-journey/my-journey-excel").catch(() => null),
          apiFetch("/sis-lms/scholarships/my-applications").catch(() => ({ applications: [] })),
        ]);
        if (!cancelled) {
          setProfile(profileData);
          setJourneyMeta(journeyExcel);
          const open = (scholData || []).filter((s) => String(s.status || "").toLowerCase() === "open");
          const appliedIds = new Set(
            (appsData.applications || []).map((a) => String(a.schol_id))
          );
          setEligibleScholarships(countEligibleScholarships(open, profileData, appliedIds));
        }
      } catch {
        if (!cancelled) setProfile({ student: {}, statistics: {} });
      }
    };

    init();
    return () => { cancelled = true; };
  }, [router]);

  const student = profile?.student ?? {};
  const cohortLevel = inferStudentLevel(student);
  const navGroups = studentNavGroups(cohortLevel).map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const Icon = NAV_ICONS[item.icon] || DashboardIcon;
      return { ...item, icon: <Icon fontSize="small" /> };
    }),
  }));

  const currentPage = navGroups
    .flatMap((g) => g.items)
    .find((item) => pathname === item.path || (item.path !== "/student" && pathname.startsWith(item.path + "/")))
    || navGroups.flatMap((g) => g.items).find((item) => pathname === item.path);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: ST.sidebar.bg }}>
      <Box sx={{ px: 2, py: 2 }}>
        <BrandLogo height={44} format="white" subtitle={t.student.portal} subtitleTone="dark" />
      </Box>

      <Divider sx={{ borderColor: ST.sidebar.divider }} />

      {user && profile && (
        <StudentSidebarSummary
          user={user}
          student={student}
          statistics={profile.statistics}
          currentYearSem={journeyMeta?.current_year_sem || student.year_of_study}
          eligibleScholarships={eligibleScholarships}
          isPostgraduate={cohortLevel === "postgraduate"}
        />
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 0.5 }}>
        {navGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: ST.sidebar.text, fontWeight: 600, fontSize: 10, letterSpacing: 0.3, px: 1.5, display: "block", mb: 0.5 }}>
              {group.label}
            </Typography>
            {group.items.map((item) => {
              const active = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => router.push(item.path)}
                    sx={{
                      borderRadius: 1.5, py: 1, px: 1.5,
                      bgcolor: active ? ST.sidebar.activeItem : "transparent",
                      "&:hover": { bgcolor: active ? ST.sidebar.activeItem : ST.sidebar.hoverItem },
                      transition: "background 0.15s",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: active ? "white" : ST.sidebar.text }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "white" : ST.sidebar.text }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: ST.sidebar.divider }} />

      {/* User footer */}
      {user && (
        <Box
          sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", "&:hover": { bgcolor: ST.sidebar.hoverItem } }}
          onClick={() => router.push("/student/profile")}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: ST.colors.primary, fontSize: 13 }}>
            {user.full_name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} sx={{ color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: ST.sidebar.text }}>{user.student_registration_number}</Typography>
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
          <Box sx={{ bgcolor: ST.colors.primary, borderRadius: 2, p: 1.5, display: "inline-flex", mb: 2 }}>
            <BrandLogo height={40} format="white" sx={{ mx: "auto", mb: 2, alignItems: "center" }} />
          </Box>
          <Typography variant="body1" color="text.secondary">{t.student.loading}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: ST.colors.bg }}>
      <AppBar position="fixed" elevation={0} sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: "white", color: ST.colors.textPrimary, borderBottom: `1px solid ${ST.colors.border}` }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: "none" } }}>
            <MenuIcon />
          </IconButton>
          <InstitutionNavbarBrand
            name={user.institution_name}
            logoUrl={user.institution_logo_url}
            subtitle={currentPage?.text || t.student.portal}
            fallbackName={t.student.portal}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageToggle iconOnly />
            <Tooltip title={t.student.topbar.notifications}>
              <IconButton>
                <Badge badgeContent={2} color="error">
                  <NotificationsIcon sx={{ color: ST.colors.textSecondary }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title={t.student.topbar.account}>
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
            <MenuItem onClick={() => { router.push("/student/profile"); setAnchorEl(null); }}>
              <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
              {t.student.topbar.myProfile}
            </MenuItem>
            <MenuItem onClick={() => { localStorage.removeItem("templumis_token"); router.push("/login"); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              {t.common.logout}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", border: "none" } }}
          open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8, bgcolor: ST.colors.bg, minHeight: "100vh" }}>
        {children}
      </Box>
    </Box>
  );
}
