import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "furn — AI Creative Platform for Furniture Marketers",
  description: "One tool replaces your entire creative stack. Background removal, AI editing, video ads — built specifically for furniture marketing. Month-to-month. Cancel anytime.",
  keywords: ["furniture marketing", "AI editing", "background removal", "video ads", "creative platform"],
  openGraph: {
    title: "furn — AI Creative Platform for Furniture Marketers",
    description: "One tool replaces your entire creative stack. Month-to-month. Cancel anytime.",
    type: "website",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
