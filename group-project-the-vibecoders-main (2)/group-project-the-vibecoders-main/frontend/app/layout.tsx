import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/toaster'
import { GlobalCommand } from '@/components/GlobalCommand'
import { ModalProvider } from '@/context/modal-context'
import { TransactionProvider } from '@/context/transaction-context'
import { GlobalModalContainer } from '@/components/dashboard/layout/GlobalModalContainer'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: {
    template: "%s | BudgetMate",
    default: "BudgetMate - Smart Financial Management",
  },
  description: "AI-powered personal finance and expense tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <TransactionProvider>
          <ModalProvider>
            {children}
            <GlobalModalContainer />
            <GlobalCommand />
            <Toaster />
            <SonnerToaster />
            <Analytics />
          </ModalProvider>
        </TransactionProvider>
      </body>
    </html>
  )
}
