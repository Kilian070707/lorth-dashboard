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
  maximumScale: 1, // Empêche le zoom intempestif sur mobile quand on tape sur un input
};

// 2. Mise à jour des métadonnées et connexion avec iOS
export const metadata: Metadata = {
  title: "LORTH Command Center",
  description: "Système d'acquisition et Mailbox LORTH",
  manifest: "/manifest.json", // On lie ton manifest ici
  appleWebApp: {
    capable: true, // Dit à l'iPhone que c'est une web app
    statusBarStyle: "black-translucent", // Rend la barre des tâches iOS jolie
    title: "LORTH",
  },
  icons: {
    apple: "/icon-192.png", // C'est CA que l'iPhone va chercher pour ton écran d'accueil
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Changement de la langue en français
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020408] text-white`}
      >
        {children}
      </body>
    </html>
  );
}