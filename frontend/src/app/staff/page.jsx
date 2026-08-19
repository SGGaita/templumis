"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { canConfigureScholarships, isFinancialAidOfficerOnly } from "@/lib/staffPermissions";

const enrollmentTrend = [
  { month: "May", students: 1050, graduated: 12 },
  { month: "Jun", students: 1080, graduated: 48 },
  { month: "Jul", students: 1075, graduated: 8 },
  { month: "Aug", students: 1100, graduated: 5 },
  { month: "Sep", students: 1185, graduated: 4 },
  { month: "Oct", students: 1200, graduated: 6 },
  { month: "Nov", students: 1210, graduated: 3 },
  { month: "Dec", students: 1195, graduated: 22 },
  { month: "Jan", students: 1215, graduated: 5 },
  { month: "Feb", students: 1230, graduated: 3 },
  { month: "Mar", students: 1240, graduated: 7 },
  { month: "Apr", students: 1250, graduated: 9 },
];

const programDistribution = [
  { name: "Computer Science", students: 320 },
  { name: "Business Admin", students: 285 },
  { name: "Engineering", students: 210 },
  { name: "Medicine", students: 175 },
  { name: "Law", students: 140 },
  { name: "Education", students: 120 },
];

const complianceData = [
  { name: "On Track", value: 856, color: ST.chart.green },
  { name: "At Risk", value: 245, color: ST.chart.yellow },
  { name: "Critical", value: 149, color: ST.chart.red },
];

const recentActivity = [
  { name: "Alice Kamau", action: "Enrolled in Computer Science", time: "2 hours ago", avatar: "A", color: ST.chart.blue },
  { name: "Brian Otieno", action: "Compliance status changed to At Risk", time: "4 hours ago", avatar: "B", color: ST.chart.yellow },
  { name: "Carol Wanjiku", action: "Scholarship application approved", time: "6 hours ago", avatar: "C", color: ST.chart.green },
  { name: "David Mwangi", action: "Support ticket opened", time: "8 hours ago", avatar: "D", color: ST.chart.red },
  { name: "Eva Njeri", action: "GPA updated: 3.85 → 3.92", time: "1 day ago", avatar: "E", color: ST.chart.purple },
];

const statCards = [
  {
    title: "Total Students",
    value: "1,250",
    delta: "+42 this month",
    up: true,
    icon: <PeopleIcon sx={{ fontSize: 22 }} />,
    color: ST.colors.primary,
    bg: ST.colors.primaryLight,
  },
  {
    title: "Active Scholarships",
    value: "85",
    delta: "+3 this week",
    up: true,
    icon: <AttachMoneyIcon sx={{ fontSize: 22 }} />,
    color: ST.colors.success,
    bg: ST.colors.successLight,
  },
  {
    title: "Open Support Tickets",
    value: "23",
    delta: "5 urgent",
    up: false,
    icon: <SupportAgentIcon sx={{ fontSize: 22 }} />,
    color: ST.colors.info,
    bg: ST.colors.infoLight,
  },
  {
    title: "At-Risk Students",
    value: "149",
    delta: "+12 from last month",
    up: false,
    icon: <WarningAmberIcon sx={{ fontSize: 22 }} />,
    color: ST.colors.error,
    bg: ST.colors.errorLight,
  },
];

const ChartCard = ({ title, subtitle, children, height = 240 }) => (
  <Paper elevation={0} sx={{ p: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%" }}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    <Box sx={{ height }}>{children}</Box>
  </Paper>
);

const QuickLink = ({ title, description, count, icon, color, bg, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      border: `1px solid ${ST.colors.border}`,
      borderRadius: 2,
      cursor: "pointer",
      height: "100%",
      "&:hover": { boxShadow: 3, borderColor: color },
      transition: "all 0.15s",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <Box sx={{ bgcolor: bg, color, p: 1, borderRadius: 1.5, display: "flex" }}>{icon}</Box>
      <KeyboardArrowRightIcon sx={{ color: ST.colors.textSecondary, fontSize: 20 }} />
    </Box>
    <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1.5, color: ST.colors.textPrimary }}>
      {title}
    </Typography>
    <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.25 }}>
      {description}
    </Typography>
    {count != null && (
      <Typography variant="h6" fontWeight={700} sx={{ mt: 1, color }}>
        {count.toLocaleString()}
      </Typography>
    )}
  </Paper>
);

const PurposeSection = ({ title, subtitle, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="overline" sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 1.5 }}>
      {subtitle}
    </Typography>
    <Grid container spacing={2}>{children}</Grid>
  </Box>
);

export default function StaffDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [atRiskSummary, setAtRiskSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [programDistribution, setProgramDistribution] = useState([]);
  const [genderDistribution, setGenderDistribution] = useState([]);
  const [nationalityDistribution, setNationalityDistribution] = useState([]);
  const [complianceData, setComplianceData] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await apiFetch("/auth/me");
        setUser(me);
        if (isFinancialAidOfficerOnly(me)) {
          router.replace("/staff/financial-aid");
          return;
        }
        const [data, riskData] = await Promise.all([
          apiFetch("/sis-lms/stats"),
          apiFetch("/sis-lms/at-risk/summary"),
        ]);
        setStats(data);
        setAtRiskSummary(riskData);
        
        // Convert program data for chart
        const programs = Object.entries(data.students_by_program || {}).map(([name, students]) => ({
          name,
          students
        }));
        setProgramDistribution(programs);

        // Convert gender data
        const genders = Object.entries(data.students_by_gender || {}).map(([name, value]) => ({
          name,
          value,
          color: name === "Male" ? ST.chart.blue : name === "Female" ? ST.chart.purple : ST.chart.teal
        }));
        setGenderDistribution(genders);

        // Convert nationality data - top 5
        const nationalities = Object.entries(data.students_by_nationality || {})
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setNationalityDistribution(nationalities);

        // Convert compliance data
        const compliance = [
          { name: "On Track", value: data.compliance_status?.green || 0, color: ST.chart.green },
          { name: "At Risk", value: data.compliance_status?.yellow || 0, color: ST.chart.yellow },
          { name: "Critical", value: data.compliance_status?.red || 0, color: ST.chart.red },
        ];
        setComplianceData(compliance);
        
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const statCardsData = [
    {
      title: "Total Students",
      value: stats?.total_students?.toLocaleString() || "0",
      delta: `${stats?.active_students || 0} active`,
      up: true,
      icon: <PeopleIcon sx={{ fontSize: 22 }} />,
      color: ST.colors.primary,
      bg: ST.colors.primaryLight,
    },
    {
      title: "Active Courses",
      value: stats?.active_courses?.toString() || "0",
      delta: `${stats?.total_courses || 0} total`,
      up: true,
      icon: <AttachMoneyIcon sx={{ fontSize: 22 }} />,
      color: ST.colors.success,
      bg: ST.colors.successLight,
    },
    {
      title: "Total Enrollments",
      value: stats?.total_enrollments?.toLocaleString() || "0",
      delta: "Current semester",
      up: true,
      icon: <SupportAgentIcon sx={{ fontSize: 22 }} />,
      color: ST.colors.info,
      bg: ST.colors.infoLight,
    },
    {
      title: "Programs",
      value: Object.keys(stats?.students_by_program || {}).length.toString(),
      delta: "Active programs",
      up: true,
      icon: <WarningAmberIcon sx={{ fontSize: 22 }} />,
      color: ST.colors.warning,
      bg: ST.colors.warningLight,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
          Staff Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mt: 0.5 }}>
          Quick access organized by what you need to do — not by system module
        </Typography>
      </Box>

      <PurposeSection title="Student success" subtitle="Identify and support students who need attention">
        <Grid item xs={12} sm={6} md={4}>
          <QuickLink
            title="At-Risk Students"
            description="Finances, attendance, and academic flags"
            count={atRiskSummary?.total}
            icon={<WarningAmberIcon />}
            color={ST.colors.error}
            bg={ST.colors.errorLight}
            onClick={() => router.push("/staff/at-risk")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickLink
            title="Student Support"
            description="Journey tracking and interventions"
            icon={<SupportAgentIcon />}
            color={ST.colors.info}
            bg={ST.colors.infoLight}
            onClick={() => router.push("/staff/support")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickLink
            title="Scholarships"
            description="Live applications from database"
            icon={<AttachMoneyIcon />}
            color={ST.colors.success}
            bg={ST.colors.successLight}
            onClick={() => router.push("/staff/scholarships")}
          />
        </Grid>
        {canConfigureScholarships(user) && (
          <Grid item xs={12} sm={6} md={4}>
            <QuickLink
              title="Configure scholarships"
              description="Financial Aid Officer — create scholarship opportunities"
              icon={<AttachMoneyIcon />}
              color="#7C3AED"
              bg="#EDE9FE"
              onClick={() => router.push("/staff/scholarships/configure")}
            />
          </Grid>
        )}
      </PurposeSection>

      <PurposeSection title="Students" subtitle="Browse the registry and filter by undergraduate or postgraduate cohort">
        <Grid item xs={12} sm={6} md={4}>
          <QuickLink
            title="All Students"
            description="Search and manage enrollment records"
            count={stats?.total_students}
            icon={<PeopleIcon />}
            color={ST.colors.primary}
            bg={ST.colors.primaryLight}
            onClick={() => router.push("/staff/students")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickLink
            title="Undergraduates"
            description="Bachelor and undergraduate programmes"
            count={stats?.students_by_level?.undergraduate}
            icon={<SchoolIcon />}
            color={ST.colors.primary}
            bg={ST.colors.primaryLight}
            onClick={() => router.push("/staff/students?cohort=undergraduate")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickLink
            title="Postgraduates"
            description="Masters, PhD, and research students"
            count={stats?.students_by_level?.postgraduate}
            icon={<ScienceIcon />}
            color="#7C3AED"
            bg="#EDE9FE"
            onClick={() => router.push("/staff/students?cohort=postgraduate")}
          />
        </Grid>
      </PurposeSection>

      <Typography variant="overline" sx={{ color: ST.colors.textSecondary, fontWeight: 700, letterSpacing: 1, display: "block", mb: 1 }}>
        Key metrics
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCardsData.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper
              elevation={0}
              sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, height: "100%", "&:hover": { boxShadow: 3, transition: "box-shadow 0.2s" } }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box sx={{ bgcolor: card.bg, color: card.color, p: 1.25, borderRadius: 1.5, display: "flex" }}>
                  {card.icon}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {card.up ? (
                    <TrendingUpIcon sx={{ fontSize: 16, color: ST.colors.success }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16, color: ST.colors.error }} />
                  )}
                  <Typography variant="caption" sx={{ color: card.up ? ST.colors.success : ST.colors.error, fontWeight: 600 }}>
                    {card.delta}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: ST.colors.textPrimary, mb: 0.25 }}>
                {card.value}
              </Typography>
              <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
                {card.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={8}>
          <ChartCard title="Enrollment Trend" subtitle="Students enrolled over the last 12 months" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ST.chart.blue} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={ST.chart.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${ST.colors.border}`, fontSize: 12 }}
                  cursor={{ stroke: ST.chart.grid }}
                />
                <Area type="monotone" dataKey="students" name="Enrolled" stroke={ST.chart.blue} strokeWidth={2} fill="url(#enrollGrad)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="graduated" name="Graduated" stroke={ST.chart.green} strokeWidth={2} fill="transparent" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <ChartCard title="Gender Distribution" subtitle="Students by gender" height={240}>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={genderDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                    {genderDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
                {genderDistribution.map((item) => (
                  <Box key={item.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 10, color: item.color }} />
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{item.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <ChartCard title="Students by Program" subtitle="Current enrollment per academic program" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programDistribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: ST.chart.text }} tickLine={false} axisLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ST.colors.border}`, fontSize: 12 }} cursor={{ fill: ST.colors.bg }} />
                <Bar dataKey="students" name="Students" radius={[4, 4, 0, 0]}>
                  {programDistribution.map((_, i) => (
                    <Cell key={i} fill={[ST.chart.blue, ST.chart.teal, ST.chart.purple, ST.chart.orange, ST.chart.indigo, ST.chart.green][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <ChartCard title="Top Nationalities" subtitle="Students by country (Top 5)" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nationalityDistribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={ST.chart.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: ST.chart.text }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${ST.colors.border}`, fontSize: 12 }} cursor={{ fill: ST.colors.bg }} />
                <Bar dataKey="value" name="Students" radius={[0, 4, 4, 0]}>
                  {nationalityDistribution.map((_, i) => (
                    <Cell key={i} fill={[ST.chart.teal, ST.chart.orange, ST.chart.purple, ST.chart.indigo, ST.chart.green][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Charts Row 3: Compliance Status */}
      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        <Grid item xs={12} md={4}>
          <ChartCard title="Compliance Status" subtitle="Based on attendance data" height={240}>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={complianceData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                    {complianceData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
                {complianceData.map((item) => (
                  <Box key={item.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 10, color: item.color }} />
                      <Typography variant="caption" sx={{ color: ST.colors.textSecondary }}>{item.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={600} sx={{ color: ST.colors.textPrimary }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
