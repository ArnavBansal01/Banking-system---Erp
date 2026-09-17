import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cassmart — Loan Origination, Operations & Collections",
  description:
    "Cassmart Micro Foundations enterprise platform covering enquiry, credit, operations, disbursement and collections in one connected case lifecycle.",
  openGraph: {
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/image.png",
    shortcut: "/image.png",
    apple: "/image.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Poppins:wght@300;400;500;600&family=Montserrat:wght@500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
