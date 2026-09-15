"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import MuiLink from "@mui/material/Link";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PublicNavbar from "@/components/PublicNavbar";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/lib/language-context";

const BRAND_NAME = "TemplumIS";

const FAQ_ITEM_HREFS = {
  demo: "/book-demo",
};

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

function CategoryTitle({ title }) {
  const parts = title.split(BRAND_NAME);

  return (
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
      {parts.length === 1
        ? title
        : parts.map((part, index) => (
            <Box component="span" key={index}>
              {part}
              {index < parts.length - 1 ? (
                <Box component="span" sx={{ textTransform: "none" }}>
                  {BRAND_NAME}
                </Box>
              ) : null}
            </Box>
          ))}
    </Typography>
  );
}

function FaqAnswer({ item, documentationLabel, linkHref }) {
  if (item.aBefore != null) {
    const middle =
      linkHref && item.linkLabel ? (
        <MuiLink
          component={Link}
          href={linkHref}
          underline="hover"
          sx={{ fontWeight: 600, color: BRAND.teal }}
        >
          {item.linkLabel}
        </MuiLink>
      ) : (
        documentationLabel
      );

    return (
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
        {item.aBefore}
        {middle}
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
  const { t } = useLanguage();
  const L = t.faqs;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <PublicNavbar />

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
              <CategoryTitle title={cat.title} />
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
                      <FaqAnswer
                        item={item}
                        documentationLabel={t.common.documentation}
                        linkHref={FAQ_ITEM_HREFS[itemKey]}
                      />
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
