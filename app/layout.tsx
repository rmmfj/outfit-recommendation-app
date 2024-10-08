import { GeistSans } from "geist/font/sans";
import "./globals.css";

import { Inter as FontSans } from "next/font/google";

import Header from "@/components/header";
import { cn } from "@/lib/utils";

import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Clothing Recommendation",
  description: "Tin can, can you?",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={GeistSans.className}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground",
          fontSans.variable
        )}
      >
        <Header />
        <div className='flex-1 flex justify-center min-h-[93vh] items-center overflow-y-scroll overflow-x-hiddena'>
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
