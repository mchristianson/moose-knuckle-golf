import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moose Knuckle Golf League",
  description: "Manage your golf league with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
