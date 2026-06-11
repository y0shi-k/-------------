import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Master Web",
  description: "料理レシピ・食材管理アプリのWeb版",
  applicationName: "Stock Master",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/stock-master-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/stock-master-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f59e0b"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
