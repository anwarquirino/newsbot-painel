import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NewsBot Painel',
    template: '%s · NewsBot Painel',
  },
  description:
    'Painel de operação do NewsBot: fila, publicações, erros e logs do pipeline de notícias automatizado.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
