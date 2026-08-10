import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shopee Connect',
  description: 'Conecte sua conta Shopee com segurança pela Shopee Open Platform.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
