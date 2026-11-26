import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/hanken-grotesk/index.css';
import './globals.css';
import { CartBar } from '@/components/layout/CartBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: { default: 'Brace – Holzofenpizza in Köln-Ehrenfeld', template: '%s · Brace' },
  description:
    'Neapolitanische Pizza aus dem Holzofen, 48 Stunden gereifter Teig. Lieferung per Lastenrad in Ehrenfeld und Umgebung oder zum Abholen. Demo-Projekt.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0f0c0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="antialiased">
      <body className="min-h-svh bg-mehl">
        <TooltipProvider>
          <a
            href="#main"
            className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-full bg-kohle px-4 py-2 text-[14px] text-mehl focus-visible:translate-y-0"
          >
            Zum Inhalt springen
          </a>
          <SmoothScroll />
          <Header />
          {children}
          <Footer />
          <CartBar />
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
