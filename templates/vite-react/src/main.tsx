import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import { API_URL, TRPCProvider } from "./trpc"
import type { AppRouter } from "../server/router"

function Providers({ children }: { children: React.ReactNode }) {
  // Created once per mount rather than at module scope, so hot reloads and
  // tests do not share a cache.
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: API_URL })],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)
