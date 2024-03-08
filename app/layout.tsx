import type { Metadata } from 'next';
import localFont from 'next/font/local';
import AuthSession from '@/AuthSession';

import './globals.css';

const myFont = localFont({
  src: './NeoDunggeunmoPro-Regular.woff2',
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={myFont.className}>
        <AuthSession>{children}</AuthSession>
      </body>
    </html>
  );
}
