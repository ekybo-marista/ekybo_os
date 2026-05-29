import type { Metadata } from "next";
import "./globals.css";
import BootScreen from "./components/BootScreen";

export const metadata: Metadata = {
  title: "EKYBO_OS - Eric Gonzalez",
  description: "Architectural portfolio interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="arch-root">
        <BootScreen />
        {children}
      </body>
    </html>
  );
}
