import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frutos Congelados NZ - Admin",
  description: "Comprá productos de Frutos Congelados por internet. Tenemos frutos congelados, frutos secos y más. Hacé tu pedido y pagalo online.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f3f4f6]`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
} 