import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
 variable: "--font-geist-sans",
 subsets: ["latin"],
 fallback: ["system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
 fallback: ["monospace"],
});

export const metadata: Metadata = {
 title: "Lead Distribution System",
 description: "Lead management and distribution platform",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning>
 <body
 className={`${geistSans.variable} ${geistMono.variable} antialiased`}
 >
 <ThemeProvider
 attribute="class"
 defaultTheme="system"
 enableSystem
 disableTransitionOnChange
 >
 {children}
 <Toaster />
 </ThemeProvider>
 </body>
 </html>
 );
}
