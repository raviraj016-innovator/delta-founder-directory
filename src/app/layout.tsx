import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "delta directory",
  description: "built by raviraj",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold">delta directory</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/me" className="hover:underline">My Account</Link>
              <Link href="/me/startups/new" className="hover:underline">Add Startup</Link>
              <Link href="/admin/review" className="hover:underline">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-700 space-y-2">
            <p>
              built by <a href="https://www.linkedin.com/in/an-unknown-person" target="_blank" rel="noreferrer" className="underline">raviraj</a>
            </p>
            <p className="text-gray-600">
              this site is neither affiliated with nor endorsed by delta (https://livetheresidency.com)
            </p>
            <p className="text-gray-600">built for fellow participants</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
