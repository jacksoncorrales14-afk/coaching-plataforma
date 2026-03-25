import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Academia de Marketing - Tu Coach Digital",
  description:
    "Aprende marketing digital con clases y capacitaciones exclusivas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Academia de Marketing. Todos los derechos reservados.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
