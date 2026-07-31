"use client";

import { createTheme } from "@mui/material/styles";
import { BRAND, FONT_FAMILY } from "@/lib/brand";

export const createAppTheme = (direction = "ltr") => createTheme({
  direction,
  palette: {
    primary: {
      main: BRAND.navy,
      light: "#3D5A8C",
      dark: "#0F1F3D",
      contrastText: BRAND.white,
    },
    secondary: {
      main: BRAND.teal,
      light: "#33B8C1",
      dark: "#00838C",
      contrastText: BRAND.white,
    },
    success: {
      main: "#059669",
      light: "#34d399",
      dark: "#047857",
    },
    warning: {
      main: "#D97706",
      light: "#fbbf24",
      dark: "#b45309",
    },
    error: {
      main: "#DC2626",
      light: "#f87171",
      dark: "#b91c1c",
    },
    background: {
      default: BRAND.pageBg,
      paper: BRAND.white,
    },
    text: {
      primary: BRAND.navy,
      secondary: BRAND.slate,
    },
    divider: BRAND.border,
  },
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    h3: {
      fontWeight: 800,
      fontSize: "2rem",
      lineHeight: 1.25,
    },
    h4: {
      fontWeight: 700,
      fontSize: "1.75rem",
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      textTransform: "none",
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.4,
      textTransform: "none",
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          textTransform: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedSecondary: {
          color: BRAND.white,
        },
        sizeSmall: {
          fontSize: "0.8125rem",
          padding: "4px 10px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px 0 rgb(25 47 90 / 0.08)",
          border: `1px solid ${BRAND.border}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px 0 rgb(25 47 90 / 0.08)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: "0.8125rem",
          padding: "10px 16px",
        },
        head: {
          fontWeight: 600,
          backgroundColor: BRAND.pageBg,
          color: BRAND.slate,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: "0.75rem",
          height: "22px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorDefault: {
          backgroundColor: BRAND.white,
          color: BRAND.navy,
        },
      },
    },
  },
});

const theme = createAppTheme();

export default theme;
