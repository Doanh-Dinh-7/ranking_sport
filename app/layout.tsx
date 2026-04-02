import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { TOURNAMENT_LOGO_URL, TOURNAMENT_NAME } from '@/lib/tournament'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: TOURNAMENT_NAME,
  description: `${TOURNAMENT_NAME} — Bảng xếp hạng, kết quả trận, lịch thi đấu, vòng loại`,
  generator: 'v0.app',
  icons: {
    icon: [{ url: TOURNAMENT_LOGO_URL, type: 'image/jpeg', sizes: 'any' }],
    apple: TOURNAMENT_LOGO_URL,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
