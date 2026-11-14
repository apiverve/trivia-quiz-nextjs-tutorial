import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const font = Bricolage_Grotesque({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Trivia Quiz | APIVerve Template',
  description: 'Ten-question trivia rounds with a score, a streak and your best round. An APIVerve template.'
};

export const viewport: Viewport = {
  themeColor: '#2b2d8f'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
