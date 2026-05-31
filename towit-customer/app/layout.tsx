import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "Towit - Ride Sharing",
  description: "Your favorite ride sharing app",
  icons: {
    icon: "/images/logo/2.svg",
  },
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
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider
          appearance={{
            variables: {
              colorBackground: "#1C1C20",
              colorForeground: "#F5F5F0",
              colorPrimary: "#F5C518",
              colorPrimaryForeground: "#0A0A0B",
              colorMutedForeground: "#A1A1AA",
              colorInput: "#18181B",
              colorInputForeground: "#F5F5F0",
              colorNeutral: "#A1A1AA",
              colorBorder: "#27272A",
              colorMuted: "#27272A",
              colorDanger: "#EF4444",
              colorSuccess: "#22C55E",
              colorWarning: "#F59E0B",
              borderRadius: "0.75rem",
            },
          }}
        >
          <main className="flex-1">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
