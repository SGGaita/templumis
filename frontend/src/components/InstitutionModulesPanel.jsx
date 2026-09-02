"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import AppsIcon from "@mui/icons-material/Apps";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import {
  INSTITUTION_MODULES,
  isModuleEnabled,
  toggleModuleSelection,
} from "@/lib/institutionModules";

export default function InstitutionModulesPanel({ institution, token, onUpdated, onError }) {
  const { t } = useLanguage();
  const L = t.globalAdmin.institutions.modules;
  const [saving, setSaving] = useState(false);

  const handleToggle = async (portal, moduleId) => {
    const next = toggleModuleSelection(institution.enabled_modules, portal, moduleId);
    setSaving(true);
    try {
      const updated = await apiFetch(`/global-admin/institutions/${institution.id}`, {
        method: "PATCH",
        body: { enabled_modules: next },
        token,
      });
      onUpdated?.(updated);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : L.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ py: 2, px: 2, bgcolor: "grey.50", borderRadius: 1, my: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography variant="body2" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AppsIcon fontSize="small" /> {L.title}
        </Typography>
        {saving && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">{L.saving}</Typography>
          </Box>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        {L.subtitle}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>{L.colModule}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, width: 140 }}>{L.colStudent}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, width: 180 }}>{L.colStaff}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {INSTITUTION_MODULES.map((mod) => (
            <TableRow key={mod.id} hover>
              <TableCell>
                <Typography variant="body2">{L[mod.id]}</Typography>
                {!mod.student && (
                  <Typography variant="caption" color="text.secondary">{L.staffOnly}</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {mod.student ? (
                  <Checkbox
                    size="small"
                    checked={isModuleEnabled(institution.enabled_modules, "student", mod.id)}
                    onChange={() => handleToggle("student", mod.id)}
                    disabled={saving}
                    inputProps={{ "aria-label": `${L[mod.id]} ${L.colStudent}` }}
                  />
                ) : (
                  <Typography variant="caption" color="text.disabled">—</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {mod.staff ? (
                  <Checkbox
                    size="small"
                    checked={isModuleEnabled(institution.enabled_modules, "staff", mod.id)}
                    onChange={() => handleToggle("staff", mod.id)}
                    disabled={saving}
                    inputProps={{ "aria-label": `${L[mod.id]} ${L.colStaff}` }}
                  />
                ) : (
                  <Typography variant="caption" color="text.disabled">—</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
