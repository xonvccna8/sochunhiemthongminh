import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Sổ Chủ Nhiệm Online · Lớp 10C3',
  description: 'Quản lý hồ sơ học sinh lớp 10C3, năm học 2026 – 2027.',
  openGraph: {
    title: 'Sổ Chủ Nhiệm Online · Lớp 10C3',
    description: 'Học sinh tự khai hồ sơ, phụ huynh theo dõi và giáo viên quản lý tập trung.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Sổ Chủ Nhiệm Online · Lớp 10C3' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sổ Chủ Nhiệm Online · Lớp 10C3',
    description: 'Năm học 2026 – 2027',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
