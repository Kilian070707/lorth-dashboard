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

// 2. Mise à jour des métadonnées avec ton nouveau favicon SVG
export const metadata: Metadata = {
  title: "LORTH Solutions",
  description: "Application de gestion LORTH",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LORTH", // LORTH Solutions
  },
  //
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png", // On garde le PNG ici car iOS ne supporte pas bien le SVG en icône d'accueil
  },
};

import { LoadingProvider } from "./contexts/LoadingContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="bg-[#020408]" suppressHydrationWarning>
      <head>
        <style>{`
          @keyframes appleFadeIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .animate-apple-fade { animation: appleFadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          .animate-apple-fade-delay { opacity: 0; animation: appleFadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards; }
          
          @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-slide-up { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020408] text-white`}
        suppressHydrationWarning
      >
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}