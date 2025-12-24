"use client";
import { RutasProvider } from "./RutasContext";

export default function RutasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RutasProvider>{children}</RutasProvider>;
} 