"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Pagination from "@mui/material/Pagination";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { apiFetch } from "@/lib/api";
import { checkScholarshipEligibility } from "@/lib/scholarships";
import ScholarshipOpportunityCard from "@/components/student/scholarships/ScholarshipOpportunityCard";
import ScholarshipDetailDialog from "@/components/student/scholarships/ScholarshipDetailDialog";

const PAGE_SIZE = 10;

function normalizeAppStatus(status) {
  return String(status || "").trim().toLowerCase();
}

/* ── Filter sidebar ── */
function FilterSidebar({ searchQuery, setSearchQuery, typeFilter, setTypeFilter, viewFilter, setViewFilter, counts }) {
  const types = [
    { value: "all", label: "All types" },
    { value: "merit", label: "Merit" },
    { value: "need", label: "Need-based" },
    { value: "talent", label: "Talent" },
    { value: "sports", label: "Sports" },
  ];
  const views = [
    { value: "eligible", label: "For you", count: counts.eligible },
    { value: "draft", label: "Continue drafts", count: counts.drafts },
    { value: "all", label: "All programmes", count: counts.totalOpen },
  ];

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search scholarships…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: ST.colors.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
        />
      </Box>

      <Divider />

      {/* View / status */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1.25 }}>
          Show
        </Typography>
        <Stack spacing={0.25}>
          {views.map(({ value, label, count }) => (
            <Box
              key={value}
              onClick={() => setViewFilter(value)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.25,
                py: 0.875,
                borderRadius: 1.5,
                cursor: "pointer",
                bgcolor: viewFilter === value ? `${BRAND.teal}12` : "transparent",
                border: `1px solid ${viewFilter === value ? `${BRAND.teal}40` : "transparent"}`,
                transition: "all 0.15s",
                "&:hover": { bgcolor: viewFilter === value ? `${BRAND.teal}12` : ST.colors.bg },
              }}
            >
              <Typography variant="body2" fontWeight={viewFilter === value ? 700 : 500} sx={{ color: viewFilter === value ? BRAND.teal : ST.colors.textPrimary, fontSize: 13 }}>
                {label}
              </Typography>
              <Box sx={{ bgcolor: viewFilter === value ? BRAND.teal : ST.colors.border, color: viewFilter === value ? "white" : ST.colors.textSecondary, borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center" }}>
                {count}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Type */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: ST.colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1.25 }}>
          Type
        </Typography>
        <RadioGroup value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {types.map(({ value, label }) => (
            <FormControlLabel
              key={value}
              value={value}
              control={<Radio size="small" sx={{ color: ST.colors.border, "&.Mui-checked": { color: BRAND.teal }, py: 0.5 }} />}
              label={<Typography variant="body2" sx={{ fontSize: 13 }}>{label}</Typography>}
              sx={{ mx: 0, mb: 0.25 }}
            />
          ))}
        </RadioGroup>
      </Box>

      {/* Reset */}
      {(typeFilter !== "all" || searchQuery) && (
        <>
          <Divider />
          <Box sx={{ p: 2, pt: 1.5 }}>
            <Button
              size="small"
              fullWidth
              onClick={() => { setTypeFilter("all"); setSearchQuery(""); }}
              sx={{ textTransform: "none", fontWeight: 600, color: ST.colors.textSecondary, fontSize: 12, border: `1px solid ${ST.colors.border}`, borderRadius: 1.5 }}
            >
              Clear filters
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

/* ── Main content ── */
function AvailableScholarshipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applyId = searchParams.get("apply");

  const [scholarships, setScholarships] = useState([]);
  const [profile, setProfile] = useState(null);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("eligible");
  const [detailScholarship, setDetailScholarship] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      apiFetch("/sis-lms/my-profile"),
      apiFetch("/sis-lms/scholarships"),
      apiFetch("/sis-lms/scholarships/my-applications"),
    ])
      .then(([profileData, scholData, appsData]) => {
        setProfile(profileData);
        setScholarships(scholData || []);
        setMyApps(appsData.applications || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!applyId || loading) return;
    router.replace(`/student/scholarships/apply/${encodeURIComponent(applyId)}`);
  }, [applyId, loading, router]);

  const appByScholId = useMemo(
    () => Object.fromEntries(myApps.map((a) => [String(a.schol_id), a])),
    [myApps]
  );

  const enriched = useMemo(() => {
    return scholarships.map((s) => {
      const existing = appByScholId[String(s.id)];
      const st = normalizeAppStatus(existing?.status);
      const elig = checkScholarshipEligibility(s, profile);
      return {
        ...s,
        ...elig,
        hasApplied: st === "submitted for review" || st === "awarded",
        isDraft: st === "draft",
        existingApp: existing,
      };
    });
  }, [scholarships, appByScholId, profile]);

  const counts = useMemo(() => ({
    eligible: enriched.filter((s) => s.eligible && !s.hasApplied).length,
    drafts: enriched.filter((s) => s.isDraft).length,
    submitted: enriched.filter((s) => s.hasApplied).length,
    totalOpen: enriched.length,
  }), [enriched]);

  // Apply search + type filter first
  const baseFiltered = useMemo(() => {
    return enriched.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || s.scholarship_name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q);
      const type = String(s.type || "").toLowerCase();
      const matchesType = typeFilter === "all" || type.includes(typeFilter) || (typeFilter === "need" && type.includes("need"));
      return matchesSearch && matchesType;
    });
  }, [enriched, searchQuery, typeFilter]);

  // Then apply view filter
  const visibleList = useMemo(() => {
    if (viewFilter === "eligible") return baseFiltered.filter((s) => s.eligible && !s.hasApplied);
    if (viewFilter === "draft") return baseFiltered.filter((s) => s.isDraft);
    return baseFiltered;
  }, [baseFiltered, viewFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchQuery, typeFilter, viewFilter]);

  const totalPages = Math.ceil(visibleList.length / PAGE_SIZE);
  const paginated = visibleList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goApply = (s) => {
    if (s.hasApplied) { router.push("/student/scholarships"); return; }
    router.push(`/student/scholarships/apply/${encodeURIComponent(s.id)}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
        <CircularProgress sx={{ color: BRAND.teal }} size={28} />
        <Typography variant="body2" color="text.secondary">Loading scholarship catalog…</Typography>
      </Box>
    );
  }

  const student = profile?.student ?? {};
  const stats = profile?.statistics ?? {};
  const gpa = stats.gpa != null ? Number(stats.gpa).toFixed(2) : "—";

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* ── Compact header ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${ST.colors.border}`, borderRadius: 2.5, background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1e3a5f 100%)` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${BRAND.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <EmojiEventsOutlinedIcon sx={{ color: BRAND.teal, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "white", lineHeight: 1.2 }}>
                Scholarship Catalog
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                {student.program || "—"} · GPA {gpa} · {student.nationality || "—"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[
              { label: "Open to you", value: counts.eligible, highlight: true },
              { label: "Drafts", value: counts.drafts },
              { label: "Submitted", value: counts.submitted },
            ].map(({ label, value, highlight }) => (
              <Box key={label} sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", fontSize: 10 }}>{label}</Typography>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: highlight ? BRAND.teal : "white", lineHeight: 1 }}>{value}</Typography>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
              onClick={() => router.push("/student/scholarships")}
              sx={{ color: "rgba(255,255,255,0.8)", textTransform: "none", fontWeight: 600, fontSize: 12, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 1.5, px: 1.5 }}
            >
              My scholarships
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Sidebar + content layout ── */}
      <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
        {/* Sidebar */}
        <Box sx={{ width: 236, flexShrink: 0 }}>
          <FilterSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            viewFilter={viewFilter}
            setViewFilter={setViewFilter}
            counts={counts}
          />
        </Box>

        {/* Cards */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Result count */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" sx={{ color: ST.colors.textSecondary }}>
              {visibleList.length === 0 ? "No results" : `${visibleList.length} scholarship${visibleList.length !== 1 ? "s" : ""}`}
              {searchQuery && <span> for <strong>"{searchQuery}"</strong></span>}
            </Typography>
            {visibleList.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
            )}
          </Box>

          {visibleList.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: `1px dashed ${ST.colors.border}`, borderRadius: 2 }}>
              <EmojiEventsOutlinedIcon sx={{ fontSize: 40, color: ST.colors.border, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: BRAND.navy }}>
                {viewFilter === "eligible" ? "No matches for your profile" : viewFilter === "draft" ? "No drafts yet" : "Nothing matches your filters"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2, maxWidth: 360, mx: "auto" }}>
                {viewFilter === "eligible"
                  ? "Try All programmes to see the full catalog, or clear the type filter."
                  : viewFilter === "draft"
                  ? "Start an application from For you — progress is saved automatically."
                  : "Clear your search or change the type filter."}
              </Typography>
              {viewFilter !== "all" && (
                <Button size="small" onClick={() => setViewFilter("all")} sx={{ textTransform: "none", fontWeight: 600, color: BRAND.teal }}>
                  Show all programmes
                </Button>
              )}
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {paginated.map((s) => (
                <ScholarshipOpportunityCard
                  key={s.id || s.scholarship_name}
                  scholarship={s}
                  onApply={goApply}
                  onViewDetails={setDetailScholarship}
                  horizontal
                />
              ))}
            </Stack>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                size="medium"
                sx={{
                  "& .MuiPaginationItem-root": { fontWeight: 600, borderRadius: 1.5 },
                  "& .Mui-selected": { bgcolor: `${BRAND.teal} !important`, color: "white" },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      <ScholarshipDetailDialog
        scholarship={detailScholarship}
        open={Boolean(detailScholarship)}
        onClose={() => setDetailScholarship(null)}
        onApply={goApply}
      />
    </Box>
  );
}

export default function AvailableScholarshipsPage() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: BRAND.teal }} /></Box>}>
      <AvailableScholarshipsContent />
    </Suspense>
  );
}
