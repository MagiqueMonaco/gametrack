import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameTrack | Discover Amazing Games",
  description: "Your premium source for finding and tracking the best video games.",
  openGraph: {
    title: "GameTrack",
    description: "Discover and track amazing video games from all platforms.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Footer />
      </body>
    </html>
  );
}
