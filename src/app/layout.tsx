import type { Metadata } from "next";
import { Roboto } from 'next/font/google'
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const roboto = Roboto({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Weather Station",
  description: "Real-time IoT weather monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
