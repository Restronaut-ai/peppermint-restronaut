import type { Metadata } from "next";
import "./globals.css";
import Fathom from "@/component/Fathom";

export const metadata: Metadata = {
  title: "Restronaut Support",
  description: "Issue tracker for restronaut and related restaurants & help desk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Fathom />
        {children}
      </body>
    </html>
  );
}
