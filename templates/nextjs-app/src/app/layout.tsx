import type { Metadata } from "next"
import type { ReactNode } from "react"
import { TRPCReactProvider } from "../trpc/client"

export const metadata: Metadata = {
  title: "tRPC + Next.js App Router",
  description: "Created with create-trpc-appx",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}
