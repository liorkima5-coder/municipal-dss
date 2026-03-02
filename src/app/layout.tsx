import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Municipal DSS - Optimal Operation",
  description: "מערכת תומכת החלטה לאופטימיזציה ותפעול עירוני חכם - ליאור קימה",
  icons: {
    icon: "/logo.png",      // הלוגו בלשונית הדפדפן
    apple: "/logo.png",     // הלוגו בשמירה למסך הבית באייפון
    shortcut: "/logo.png",  // אייקון קיצור דרך
  },


};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
