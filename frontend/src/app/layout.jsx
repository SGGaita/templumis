import Providers from "./providers";
import { montserrat } from "@/lib/fonts";

export const metadata = {
  title: "TemplumIS - Powering Smarter Higher Educations",
  description:
    "Institutional intelligence for enrollment, student success, financial aid, grants, and rankings.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className={montserrat.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
