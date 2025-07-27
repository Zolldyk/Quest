import type { Metadata } from 'next'
import './globals.css'
import CustomThirdwebProvider from '../Frontend/src/components/providers/ThirdwebProvider'

export const metadata: Metadata = {
  title: 'Quest DApp - DeFi-Powered NFT Quest Game',
  description: 'Complete community-driven quests, earn token rewards, and mint unique NFT badges on Etherlink',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased">
        <CustomThirdwebProvider>
          {children}
        </CustomThirdwebProvider>
      </body>
    </html>
  )
}