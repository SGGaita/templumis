"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import LanguageIcon from "@mui/icons-material/Language";
import CheckIcon from "@mui/icons-material/Check";
import { useLanguage } from "@/lib/language-context";
import { LANGUAGE_GROUPS, LANGUAGES } from "@/lib/i18n/index";

export default function LanguageToggle({ iconOnly = false }) {
  const { language, setLanguage, t } = useLanguage();
  const [anchor, setAnchor] = useState(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<LanguageIcon />}
        sx={{
          color: "text.primary",
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.9rem",
          px: 1.5,
          minWidth: 0,
        }}
      >
        {!iconOnly && currentLang.label}
      </Button>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { width: 320, borderRadius: 2, mt: 0.5, boxShadow: 6 },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, letterSpacing: 1, color: "text.secondary" }}
          >
            {t.language.selectLabel}
          </Typography>
        </Box>

        {LANGUAGE_GROUPS.map((group) => (
          <Box key={group.group} sx={{ mb: 2 }}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.7rem" }}
              >
                {group.group}
              </Typography>
            </Box>
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {group.languages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <Box
                    component="li"
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setAnchor(null);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1,
                      cursor: "pointer",
                      bgcolor: isSelected ? "action.selected" : "transparent",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: isSelected ? 600 : 400 }}
                    >
                      {lang.label}
                    </Typography>
                    {isSelected && <CheckIcon fontSize="small" color="primary" />}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Popover>
    </>
  );
}

