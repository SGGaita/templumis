"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import MuiLink from "@mui/material/Link";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BrandLogo from "@/components/BrandLogo";
import LanguageToggle from "@/components/LanguageToggle";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/lib/language-context";

const FAQ_CATEGORIES = [
  {
    key: "about",
    items: ["whatIs", "problem", "connectedIntelligence"],
  },
  {
    key: "capabilities",
    items: ["consolidate", "reporting", "leadership", "studentResearch", "accreditation"],
  },
  {
    key: "rankings",
    items: ["readiness", "frameworks", "repository"],
  },
  {
    key: "gettingStarted",
    items: ["whoUses", "accounts", "demo", "help"],
  },
];

function FaqAnswer({ item, documentationLabel }) {
  if (item.aBefore != null) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
        {item.aBefore}
        <MuiLink
          component={Link}
          href="/documentation"
          underline="hover"
          sx={{ fontWeight: 600, color: BRAND.teal }}
        >
          {documentationLabel}
        </MuiLink>
        {item.aAfter}
      </Typography>
    );
  }

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ lineHeight: 1.75, whiteSpace: "pre-line" }}
    >
      {item.a}
    </Typography>
  );
}

export default function FaqsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const L = t.faqs;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar
          sx={{
            minHeight: 88,
            py: 1.5,
            px: { xs: 2, sm: 3 },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <BrandLogo height={64} format="png" onClick={() => router.push("/")} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto", flexShrink: 0 }}>
            <LanguageToggle />
            <Button variant="text" onClick={() => router.push("/documentation")} sx={{ fontWeight: 600 }}>
              {t.common.documentation}
            </Button>
            <Button variant="outlined" onClick={() => router.push("/login")}>
              {t.home.nav.loginBtn}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: BRAND.navy, color: "white", py: 5, textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {L.title}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 640, mx: "auto" }}>
            {L.subtitle}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 5, flex: 1 }}>
        {FAQ_CATEGORIES.map((category, catIndex) => {
          const cat = L.categories[category.key];
          return (
            <Box key={category.key} sx={{ mb: catIndex < FAQ_CATEGORIES.length - 1 ? 5 : 0 }}>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: BRAND.teal,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  mb: 0.5,
                }}
              >
                {cat.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 560 }}>
                {cat.intro}
              </Typography>

              {category.items.map((itemKey, itemIndex) => {
                const item = cat.items[itemKey];
                return (
                  <Accordion
                    key={itemKey}
                    defaultExpanded={catIndex === 0 && itemIndex === 0}
                    disableGutters
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "8px !important",
                      "&:before": { display: "none" },
                      overflow: "hidden",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ px: 2, "& .MuiAccordionSummary-content": { my: 1.5 } }}
                    >
                      <Typography fontWeight={600}>{item.q}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 0 }}>
                      <FaqAnswer item={item} documentationLabel={t.common.documentation} />
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          );
        })}
      </Container>

      <SiteFooter />
    </Box>
  );
}
