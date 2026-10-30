import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "סטודיו דילוש",
  description: "מערכת פרטית לניהול התוכן של דילוש",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-180.png" },
  appleWebApp: { capable: true, title: "סטודיו", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
