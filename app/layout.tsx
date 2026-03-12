import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Déclaration du Viewport pour le mobile et la couleur du thème
export const viewport: Viewport = {
  themeColor: "#020408",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Empêche le zoom sur les inputs iOS
};

// 2. Mise à jour des métadonnées et connexion avec iOS
export const metadata: Metadata = {
  title: "LORTH Command Center",
  description: "Système d'acquisition et Mailbox LORTH",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LORTH",
  },
  icons: {
    icon: "/apple-touch-icon.png", // Utilise ton nouveau logo pour l'onglet du navigateur
    shortcut: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png", // Utilise le fichier que tu as dans public pour l'iPhone
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="bg-[#020408]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020408] text-white`}
      >
        {children}
      </body>
    </html>
  );
}