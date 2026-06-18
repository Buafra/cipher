import type { Metadata } from "next";
import { Spectral, Inter } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

// Display serif carries Cipher's identity; sans handles the UI plumbing.
const display = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Cipher",
  description: "A private chief of staff.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased bg-ink text-paper min-h-screen">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
