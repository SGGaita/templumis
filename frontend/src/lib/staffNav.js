import DashboardIcon from "@mui/icons-material/Dashboard";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HandshakeIcon from "@mui/icons-material/Handshake";
import HistoryIcon from "@mui/icons-material/History";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { isFinancialAidOfficerOnly } from "@/lib/staffPermissions";
import { isSponsorUser } from "@/lib/sponsorPermissions";

/** Staff sidebar grouped by function / purpose (not product module). */
export const staffNavGroups = [
  {
    label: "Overview",
    items: [
      { text: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/staff" },
    ],
  },
  {
    label: "Student success",
    items: [
      {
        text: "At-Risk Students",
        icon: <WarningAmberIcon fontSize="small" />,
        path: "/staff/at-risk",
        badgeKey: "at_risk",
      },
      {
        text: "Student Support",
        icon: <SupportAgentIcon fontSize="small" />,
        path: "/staff/support",
        badge: 5,
      },
    ],
  },
  {
    label: "Student cohorts",
    items: [
      {
        text: "Undergraduates",
        icon: <SchoolIcon fontSize="small" />,
        path: "/staff/enrollment",
        query: { cohort: "undergraduate" },
      },
      {
        text: "Postgraduates",
        icon: <ScienceIcon fontSize="small" />,
        path: "/staff/enrollment",
        query: { cohort: "postgraduate" },
      },
    ],
  },
  {
    label: "Enrollment & records",
    items: [
      { text: "All Students", icon: <PeopleIcon fontSize="small" />, path: "/staff/enrollment" },
    ],
  },
  {
    label: "Financial aid",
    items: [
      { text: "Scholarships", icon: <AttachMoneyIcon fontSize="small" />, path: "/staff/scholarships" },
      {
        text: "Triage & verification",
        icon: <FactCheckIcon fontSize="small" />,
        path: "/staff/scholarships/triage",
        roles: ["scholarship_office", "global_admin"],
      },
      {
        text: "Review Outcome and Awards",
        icon: <EmojiEventsOutlinedIcon fontSize="small" />,
        path: "/staff/scholarships/decisions",
        roles: ["scholarship_office", "institution_admin", "vice_chancellor", "global_admin"],
      },
      {
        text: "Configure scholarships",
        icon: <SettingsIcon fontSize="small" />,
        path: "/staff/scholarships/configure",
        roles: ["scholarship_office", "global_admin"],
      },
    ],
  },
  {
    label: "Research & grants",
    items: [
      { text: "Grants & Research", icon: <ScienceIcon fontSize="small" />, path: "/staff/grants" },
    ],
  },
  {
    label: "Institutional insight",
    items: [
      { text: "University Rankings", icon: <EmojiEventsIcon fontSize="small" />, path: "/staff/rankings" },
      { text: "Analytics", icon: <BarChartIcon fontSize="small" />, path: "/staff/analytics" },
    ],
  },
  {
    label: "System",
    items: [
      { text: "Settings", icon: <SettingsIcon fontSize="small" />, path: "/staff/settings" },
    ],
  },
];

export const atRiskCategoryFilters = [
  { id: "all", label: "All flags", icon: WarningAmberIcon },
  { id: "finances", label: "Finances", icon: AccountBalanceWalletIcon },
  { id: "attendance", label: "Attendance", icon: EventAvailableIcon },
  { id: "academic", label: "Academic", icon: MenuBookIcon },
];

export function buildStaffNavHref(item) {
  if (!item.query) return item.path;
  const params = new URLSearchParams(item.query);
  return `${item.path}?${params.toString()}`;
}

export function isStaffNavItemActive(item, pathname, searchParams) {
  if (pathname !== item.path && !pathname.startsWith(`${item.path}/`)) {
    return false;
  }
  if (!item.query) {
    if (item.path === "/staff/enrollment" && searchParams?.get("cohort")) {
      return false;
    }
    return true;
  }
  return Object.entries(item.query).every(
    ([key, value]) => searchParams?.get(key) === value
  );
}

export function canAccessStaffNavItem(item, user) {
  if (!item.roles || !item.roles.length) return true;
  if (!user) return false;
  return item.roles.includes(user.role);
}

/** Financial Aid Officer: scholarships & grants only. Sponsor: sponsorship only. Other staff: full nav. */
export function getStaffNavGroups(user) {
  if (isSponsorUser(user)) {
    return [
      {
        label: "Grant sponsorship",
        items: [
          { text: "Sponsorship Requests", icon: <HandshakeIcon fontSize="small" />, path: "/sponsor/requests" },
          { text: "Past Requests", icon: <HistoryIcon fontSize="small" />, path: "/sponsor/past" },
        ],
      },
    ];
  }

  if (isFinancialAidOfficerOnly(user)) {
    return [
      {
        label: "Overview",
        items: [
          { text: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/staff/financial-aid" },
        ],
      },
      {
        label: "Scholarships",
        items: [
          { text: "Applications", icon: <AttachMoneyIcon fontSize="small" />, path: "/staff/scholarships/applications" },
          { text: "Triage & verification", icon: <FactCheckIcon fontSize="small" />, path: "/staff/scholarships/triage" },
          { text: "Review Outcome and Awards", icon: <EmojiEventsOutlinedIcon fontSize="small" />, path: "/staff/scholarships/decisions" },
          { text: "Opportunities", icon: <MenuBookIcon fontSize="small" />, path: "/staff/scholarships/opportunities" },
          { text: "Configure", icon: <SettingsIcon fontSize="small" />, path: "/staff/scholarships/configure" },
        ],
      },
      {
        label: "Grants",
        items: [
          { text: "Lifecycle pipeline", icon: <ScienceIcon fontSize="small" />, path: "/staff/grants/lifecycle" },
          { text: "Applications", icon: <ScienceIcon fontSize="small" />, path: "/staff/grants/applications" },
          { text: "Opportunities", icon: <MenuBookIcon fontSize="small" />, path: "/staff/grants/opportunities" },
          { text: "Configure", icon: <SettingsIcon fontSize="small" />, path: "/staff/grants/configure" },
        ],
      },
    ];
  }

  return staffNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessStaffNavItem(item, user)),
    }))
    .filter((group) => group.items.length > 0);
}

export function findStaffNavPage(pathname, searchParams, user) {
  const groups = user ? getStaffNavGroups(user) : staffNavGroups;
  for (const group of groups) {
    for (const item of group.items) {
      if (isStaffNavItemActive(item, pathname, searchParams)) {
        return item;
      }
    }
  }
  return null;
}
