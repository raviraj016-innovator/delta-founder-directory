import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";
import Analytics from "@/components/Analytics";

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
  const GA_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var s=localStorage.getItem('theme');var t=s||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();",
          }}
        />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Analytics />
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
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-[var(--foreground)]/80">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <p>
                  built by <a href="https://www.linkedin.com/in/an-unknown-person" target="_blank" rel="noreferrer" className="underline">raviraj</a>
                </p>
                <p className="opacity-80">
                  this site is neither affiliated with nor endorsed by delta (https://livetheresidency.com)
                </p>
                <p className="opacity-80">built for fellow participants</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
