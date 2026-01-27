import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Frutos Congelados NZ - Admin",
  description: "Comprá productos de Frutos Congelados por internet. Tenemos frutos congelados, frutos secos y más. Hacé tu pedido y pagalo online.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f3f4f6]">
      {children}
    </div>
  );
}