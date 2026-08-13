"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { BRAND } from "@/lib/brand";

function renderInline(text) {
  if (text == null) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Box key={i} component="strong" sx={{ fontWeight: 600 }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Box
          key={i}
          component="code"
          sx={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "0.85em",
            bgcolor: BRAND.navyLight,
            color: BRAND.navy,
            px: 0.6,
            py: 0.15,
            borderRadius: 0.75,
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    return part;
  });
}

function headingSx(level) {
  return {
    fontWeight: 700,
    color: BRAND.navy,
    mt: level === "h2" ? 5 : 3.5,
    mb: 1.5,
    scrollMarginTop: 96,
    ...(level === "h2"
      ? { fontSize: { xs: "1.35rem", md: "1.5rem" }, pb: 1, borderBottom: `2px solid ${BRAND.teal}` }
      : { fontSize: { xs: "1.05rem", md: "1.15rem" } }),
  };
}

export default function DocsRenderer({ blocks }) {
  return (
    <Box>
      {blocks.map((block, index) => {
        if (block.type === "lead") {
          return (
            <Typography
              key={index}
              variant="body1"
              sx={{ fontSize: "1.125rem", lineHeight: 1.7, color: BRAND.slate, mb: 3 }}
            >
              {renderInline(block.text)}
            </Typography>
          );
        }
        if (block.type === "p") {
          return (
            <Typography key={index} variant="body1" sx={{ mb: 2, lineHeight: 1.75, color: "text.primary" }}>
              {renderInline(block.text)}
            </Typography>
          );
        }
        if (block.type === "h2" || block.type === "h3") {
          const Tag = block.type;
          return (
            <Typography key={index} component={Tag} id={block.id} sx={headingSx(block.type)}>
              {block.text}
            </Typography>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const ListTag = block.type === "ol" ? "ol" : "ul";
          return (
            <Box
              key={index}
              component={ListTag}
              sx={{
                mt: 0,
                mb: 2.5,
                pl: 3,
                "& li": { mb: 1, lineHeight: 1.7 },
              }}
            >
              {block.items.map((item, i) => (
                <li key={i}>
                  <Typography component="span" variant="body1">
                    {renderInline(item)}
                  </Typography>
                </li>
              ))}
            </Box>
          );
        }
        if (block.type === "table") {
          return (
            <TableContainer
              key={index}
              component={Paper}
              variant="outlined"
              sx={{ mb: 3, borderColor: BRAND.border, boxShadow: "none" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: BRAND.navyLight }}>
                    {block.headers.map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: BRAND.navy, whiteSpace: "nowrap" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {block.rows.map((row, ri) => (
                    <TableRow key={ri} sx={{ "&:nth-of-type(even)": { bgcolor: "grey.50" } }}>
                      {row.map((cell, ci) => (
                        <TableCell
                          key={ci}
                          sx={{
                            verticalAlign: "top",
                            fontFamily: ci === 0 && block.headers[0] === "Method" ? "ui-monospace, Menlo, Consolas, monospace" : "inherit",
                            fontSize: ci > 0 ? 13.5 : 14,
                            lineHeight: 1.55,
                          }}
                        >
                          {renderInline(cell)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          );
        }
        if (block.type === "code") {
          return (
            <Box key={index} sx={{ mb: 3 }}>
              {block.label && (
                <Typography variant="caption" sx={{ color: BRAND.navyMuted, fontWeight: 600, letterSpacing: 0.4 }}>
                  {block.label}
                </Typography>
              )}
              <Box
                component="pre"
                sx={{
                  mt: 0.5,
                  mb: 0,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: BRAND.navy,
                  color: "#E8EDF5",
                  overflowX: "auto",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  border: `1px solid ${BRAND.navy}`,
                }}
              >
                {block.text}
              </Box>
            </Box>
          );
        }
        if (block.type === "callout") {
          const severity = block.tone === "warn" ? "warning" : block.tone === "note" ? "info" : "success";
          return (
            <Alert
              key={index}
              severity={severity}
              sx={{ mb: 3, borderRadius: 1.5, "& .MuiAlert-message": { width: "100%" } }}
            >
              {block.title && <AlertTitle sx={{ fontWeight: 700 }}>{block.title}</AlertTitle>}
              <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                {renderInline(block.text)}
              </Typography>
            </Alert>
          );
        }
        return null;
      })}
    </Box>
  );
}
