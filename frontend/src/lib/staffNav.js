import DashboardIcon from "@mui/icons-material/Dashboard";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
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
import { filterNavGroupsByModules, normalizeEnabledModules } from "@/lib/institutionModules";

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
        module: "enrollment",
      },
      {
        text: "Student Support",
        icon: <SupportAgentIcon fontSize="small" />,
        path: "/staff/support",
        badge: 5,
        module: "support",
      },
    ],
  },
  {
    label: "Students",
    items: [
      {
        text: "Students",
        icon: <PeopleIcon fontSize="small" />,
        path: "/staff/students",
        activePrefixes: ["/staff/enrollment"],
        module: "enrollment",
      },
    ],
  },
  {
    label: "Financial aid",
    items: [
      { text: "Scholarships", icon: <AttachMoneyIcon fontSize="small" />, path: "/staff/scholarships", module: "scholarships" },
      {
        text: "Triage & verification",
        icon: <FactCheckIcon fontSize="small" />,
        path: "/staff/scholarships/triage",
        roles: ["scholarship_office", "global_admin"],
        module: "scholarships",
      },
      {
        text: "Review Outcome and Awards",
        icon: <EmojiEventsOutlinedIcon fontSize="small" />,
        path: "/staff/scholarships/decisions",
        roles: ["scholarship_office", "institution_admin", "vice_chancellor", "global_admin"],
        module: "scholarships",
      },
      {
        text: "Configure scholarships",
        icon: <SettingsIcon fontSize="small" />,
        path: "/staff/scholarships/configure",
        roles: ["scholarship_office", "global_admin"],
        module: "scholarships",
      },
    ],
  },
  {
    label: "Research & grants",
    items: [
      { text: "Grants & Research", icon: <ScienceIcon fontSize="small" />, path: "/staff/grants", module: "grants" },
    ],
  },
  {
    label: "Institutional insight",
    items: [
      { text: "University Rankings", icon: <EmojiEventsIcon fontSize="small" />, path: "/staff/rankings", module: "rankings" },
      { text: "Analytics", icon: <BarChartIcon fontSize="small" />, path: "/staff/analytics", textKey: "analytics" },
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
  const prefixes = item.activePrefixes || [];
  const matchesPath =
    pathname === item.path ||
    pathname.startsWith(`${item.path}/`) ||
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!matchesPath) return false;
  if (!item.query) return true;
  return Object.entries(item.query).every(
    ([key, value]) => searchParams?.get(key) === value
  );
}

export function canAccessStaffNavItem(item, user) {
  if (!item.roles || !item.roles.length) return true;
  if (!user) return false;
  return item.roles.includes(user.role);
}

function applyInstitutionModules(groups, user) {
  const enabled = normalizeEnabledModules(user?.enabled_modules).staff;
  return filterNavGroupsByModules(groups, enabled, user?.staff_role_access || null);
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
    return applyInstitutionModules(
      [
        {
          label: "Overview",
          items: [
            { text: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/staff/financial-aid", module: "scholarships" },
          ],
        },
        {
          label: "Scholarships",
          items: [
            { text: "Applications", icon: <AttachMoneyIcon fontSize="small" />, path: "/staff/scholarships/applications", module: "scholarships" },
            { text: "Triage & verification", icon: <FactCheckIcon fontSize="small" />, path: "/staff/scholarships/triage", module: "scholarships" },
            { text: "Review Outcome and Awards", icon: <EmojiEventsOutlinedIcon fontSize="small" />, path: "/staff/scholarships/decisions", module: "scholarships" },
            { text: "Opportunities", icon: <MenuBookIcon fontSize="small" />, path: "/staff/scholarships/opportunities", module: "scholarships" },
            { text: "Configure", icon: <SettingsIcon fontSize="small" />, path: "/staff/scholarships/configure", module: "scholarships" },
          ],
        },
        {
          label: "Grants",
          items: [
            { text: "Lifecycle pipeline", icon: <ScienceIcon fontSize="small" />, path: "/staff/grants/lifecycle", module: "grants" },
            { text: "Applications", icon: <ScienceIcon fontSize="small" />, path: "/staff/grants/applications", module: "grants" },
            { text: "Opportunities", icon: <MenuBookIcon fontSize="small" />, path: "/staff/grants/opportunities", module: "grants" },
            { text: "Configure", icon: <SettingsIcon fontSize="small" />, path: "/staff/grants/configure", module: "grants" },
          ],
        },
      ],
      user
    );
  }

  return applyInstitutionModules(
    staffNavGroups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => canAccessStaffNavItem(item, user))
          .map((item) => {
            if (
              user?.role === "vice_chancellor" &&
              item.path === "/staff/analytics"
            ) {
              return { ...item, text: "Executive briefing" };
            }
            return item;
          }),
      }))
      .filter((group) => group.items.length > 0),
    user
  );
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
