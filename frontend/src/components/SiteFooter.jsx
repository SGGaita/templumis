"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import { useLanguage } from "@/lib/language-context";

/**
 * Public site footer. Documentation is a real route; privacy / terms / contact
 * remain labels until dedicated pages exist.
 */
export default function SiteFooter({ showLegal = true }) {
  const { t } = useLanguage();

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 3,
        px: 2,
        bgcolor: "grey.100",
        borderTop: "1px solid",
        borderColor: "grey.300",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {t.common.copyright}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <MuiLink
              component={Link}
              href="/documentation"
              underline="hover"
              variant="body2"
              color="text.secondary"
              sx={{ "&:hover": { color: "primary.main" } }}
            >
              {t.common.documentation}
            </MuiLink>
            {showLegal && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {t.common.privacyPolicy}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.common.termsOfService}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.common.contact}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
