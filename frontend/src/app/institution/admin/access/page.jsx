"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import TuneIcon from "@mui/icons-material/Tune";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import { ST } from "@/lib/staffTheme";
import { useLanguage } from "@/lib/language-context";
import {
  INSTITUTION_MODULES,
  STAFF_ACCESS_ROLES,
  STAFF_MODULE_NAV_ITEMS,
  normalizeEnabledModules,
  normalizeStaffRoleModules,
  roleModuleSelectionState,
  toggleRoleModuleSelection,
  toggleRoleNavItemSelection,
  isRoleNavItemEnabled,
} from "@/lib/institutionModules";

export default function RoleAccessPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const L = t.institutionAdmin.access;
  const rolesL = t.auth.signup.step1.roles;
  const moduleLabels = t.globalAdmin.institutions.modules;
  const itemLabels = L.navItems || {};

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleTab, setRoleTab] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/institution/profile", { token });
      setProfile(data);
      setError("");
    } catch {
      setError(L.fetchError);
    } finally {
      setLoading(false);
    }
  }, [token, L.fetchError]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "institution_admin") {
      router.push("/institution/login");
      return;
    }
    fetchProfile();
  }, [user, authLoading, router, fetchProfile]);

  const staffCeiling = useMemo(
    () => normalizeEnabledModules(profile?.enabled_modules).staff,
    [profile?.enabled_modules]
  );

  const roleModules = useMemo(
    () => normalizeStaffRoleModules(profile?.staff_role_modules, staffCeiling),
    [profile?.staff_role_modules, staffCeiling]
  );

  const selectedRole = STAFF_ACCESS_ROLES[roleTab] || STAFF_ACCESS_ROLES[0];
  const roleGrants = roleModules[selectedRole] || {};

  const persistGrants = async (next) => {
    if (!profile || !token) return;
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const updated = await apiFetch("/institution/profile", {
        method: "PATCH",
        body: { staff_role_modules: next },
        token,
      });
      setProfile(updated);
      setSuccess(L.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : L.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModule = async (moduleId) => {
    if (!staffCeiling.includes(moduleId)) return;
    const next = toggleRoleModuleSelection(
      roleModules,
      selectedRole,
      moduleId,
      profile.enabled_modules
    );
    await persistGrants(next);
  };

  const handleToggleItem = async (moduleId, path) => {
    if (!staffCeiling.includes(moduleId)) return;
    const next = toggleRoleNavItemSelection(
      roleModules,
      selectedRole,
      moduleId,
      path,
      profile.enabled_modules
    );
    await persistGrants(next);
  };

  const roleLabel = (role) => rolesL[role] || role;
  const itemLabel = (item) => itemLabels[item.labelKey] || item.path;

  if (authLoading || loading) {
    return (
      <InstitutionAdminLayout>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </InstitutionAdminLayout>
    );
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1.25} mb={0.5}>
          <TuneIcon sx={{ color: ST.colors.primary }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: ST.colors.textPrimary }}>
            {L.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {L.subtitle}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, md: 3 }, border: `1px solid ${ST.colors.border}` }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {L.institutionCeiling}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {L.institutionCeilingHint}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {INSTITUTION_MODULES.filter((m) => m.staff).map((mod) => {
            const on = staffCeiling.includes(mod.id);
            return (
              <Chip
                key={mod.id}
                size="small"
                label={moduleLabels[mod.id]}
                color={on ? "primary" : "default"}
                variant={on ? "filled" : "outlined"}
                sx={{ opacity: on ? 1 : 0.55 }}
              />
            );
          })}
        </Box>

        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {L.roleHeading}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {L.roleHint}
        </Typography>

        <Tabs
          value={roleTab}
          onChange={(_, v) => setRoleTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            borderBottom: `1px solid ${ST.colors.border}`,
            "& .Mui-selected": { fontWeight: 700, color: ST.colors.primary },
            "& .MuiTabs-indicator": { bgcolor: ST.colors.primary },
          }}
        >
          {STAFF_ACCESS_ROLES.map((role) => (
            <Tab key={role} label={roleLabel(role)} sx={{ textTransform: "none" }} />
          ))}
        </Tabs>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="body2" fontWeight={600}>
            {L.modulesForRole.replace("{role}", roleLabel(selectedRole))}
          </Typography>
          {saving && (
            <Box display="flex" alignItems="center" gap={0.75}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">
                {L.saving}
              </Typography>
            </Box>
          )}
        </Box>

        {INSTITUTION_MODULES.filter((m) => m.staff).map((mod, index) => {
          const institutionOn = staffCeiling.includes(mod.id);
          const state = roleModuleSelectionState(roleGrants, mod.id);
          const items = STAFF_MODULE_NAV_ITEMS[mod.id] || [];
          const expanded = institutionOn && (state.checked || state.indeterminate);

          return (
            <Box key={mod.id}>
              {index > 0 && <Divider sx={{ my: 1.5 }} />}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={institutionOn && state.checked}
                    indeterminate={institutionOn && state.indeterminate}
                    disabled={!institutionOn || saving}
                    onChange={() => handleToggleModule(mod.id)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {moduleLabels[mod.id]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {!institutionOn
                        ? L.moduleDisabledByInstitution
                        : state.checked
                          ? L.wholeModuleOn
                          : state.indeterminate
                            ? L.partialModuleOn
                            : L.moduleOff}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", mb: 0.5 }}
              />
              <Collapse in={expanded || (institutionOn && items.length > 0)} timeout="auto">
                <Box sx={{ pl: 4, pb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                    {L.itemsHint}
                  </Typography>
                  {items.map((item) => {
                    const checked =
                      institutionOn && isRoleNavItemEnabled(roleGrants, mod.id, item.path);
                    return (
                      <FormControlLabel
                        key={item.path}
                        control={
                          <Checkbox
                            size="small"
                            checked={checked}
                            disabled={!institutionOn || saving}
                            onChange={() => handleToggleItem(mod.id, item.path)}
                          />
                        }
                        label={
                          <Typography variant="body2">{itemLabel(item)}</Typography>
                        }
                        sx={{ display: "flex", ml: 0 }}
                      />
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Paper>
    </InstitutionAdminLayout>
  );
}
