"use client";

import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { createAppTheme } from "@/theme/theme";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider, useLanguage } from "@/lib/language-context";

function ThemedApp({ children }) {
  const { language } = useLanguage();
  const theme = useMemo(() => {
    const isRTL = language === "ar";
    return createAppTheme(isRTL ? "rtl" : "ltr");
  }, [language]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

export default function Providers({ children }) {
  return (
    <AppRouterCacheProvider>
      <LanguageProvider>
        <ThemedApp>{children}</ThemedApp>
      </LanguageProvider>
    </AppRouterCacheProvider>
  );
}
