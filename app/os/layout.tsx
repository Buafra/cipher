import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cipher OS',
  description: 'Global AI operating system launcher',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
