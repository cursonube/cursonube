import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Solo para las herramientas internas (Staff/Creator/Alumno) — ver
 * `.p-shell` en globals.css. El sitio de marketing y las plantillas
 * públicas de cada academia no la usan, mantienen su propia tipografía.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cursonube",
  description: "Creá tu academia online en 5 minutos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
