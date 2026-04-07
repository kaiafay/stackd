import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NON_DEFAULT_THEMES } from "@/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stackd",
  description: "A clean, design-forward link-in-bio tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(!window.location.pathname.startsWith('/dashboard'))return;var t=localStorage.getItem('stackd-theme');if(t&&${JSON.stringify(NON_DEFAULT_THEMES)}.indexOf(t)!==-1)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
