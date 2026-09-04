"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BrandLogo from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/lib/language-context";

/** Public site footer: brand, useful links, and contact address. */
export default function SiteFooter() {
  const router = useRouter();
  const { t } = useLanguage();
  const F = t.common.footer;

  const linkSx = {
    color: "rgba(255,255,255,0.78)",
    display: "block",
    mb: 1,
    "&:hover": { color: BRAND.white },
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: { xs: 4, md: 5 },
        px: 2,
        bgcolor: BRAND.navy,
        color: BRAND.white,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid item xs={12} sm={4}>
            <BrandLogo
              height={48}
              format="white"
              onClick={() => router.push("/")}
            />
            <Typography
              variant="body2"
              sx={{ mt: 2, color: "rgba(255,255,255,0.65)", maxWidth: 260 }}
            >
              © {new Date().getFullYear()} {t.common.copyright}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, letterSpacing: 0.4, mb: 1.5, color: BRAND.white }}
            >
              {F.usefulLinks}
            </Typography>
            <MuiLink component={Link} href="/" underline="hover" variant="body2" sx={linkSx}>
              {F.home}
            </MuiLink>
            <MuiLink
              component={Link}
              href="/documentation"
              underline="hover"
              variant="body2"
              sx={linkSx}
            >
              {t.common.documentation}
            </MuiLink>
            <MuiLink
              component={Link}
              href="/faqs"
              underline="hover"
              variant="body2"
              sx={{ ...linkSx, mb: 0 }}
            >
              {F.faqs}
            </MuiLink>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, letterSpacing: 0.4, mb: 1.5, color: BRAND.white }}
            >
              {t.common.contact}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
              <LocationOnOutlinedIcon
                sx={{ fontSize: 20, mt: 0.25, color: BRAND.teal, flexShrink: 0 }}
              />
              <Box>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                  {F.addressOrg}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
                  {F.addressBuilding}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
                  {F.addressCity}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
