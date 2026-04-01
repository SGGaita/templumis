import Providers from "./providers";

export const metadata = {
  title: "TemplumIS — Institutional Intelligence Dashboard",
  description:
    "Open Infrastructure enrollment, grants, and scholarship dashboard for universities and research hospitals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
