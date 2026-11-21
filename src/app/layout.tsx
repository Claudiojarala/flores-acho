import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flores de Acho – Mercado de Flores en línea',
  description:
    'Compra flores, arreglos y coronas de los puestos del Mercado de Flores de Acho (Rímac, Lima) con pago digital, recojo o delivery.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
