import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SecureVote - Blockchain Voting Platform",
  description: "Next-generation voting platform with blockchain validation and cryptographic security",
  keywords: ["voting", "blockchain", "security", "democracy", "elections"],
  authors: [{ name: "SecureVote Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900`}
      >
        <div className="relative min-h-screen">
          {/* Animated background grid */}
          <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
          
          {/* Floating orbs for ambiance */}
          <div className="fixed top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-float" />
          <div className="fixed bottom-20 right-20 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
          <div className="fixed top-1/2 left-1/4 w-16 h-16 bg-blue-600/20 rounded-full blur-xl animate-float" style={{ animationDelay: "4s" }} />
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
