import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import { trpc } from "./trpc"

const qc = new QueryClient()
const trpcClient = trpc.createClient({
  links: [
    // For a simple example we use httpBatchLink to a relative URL
    // In real apps, configure baseUrl/headers as needed
    trpc.httpBatchLink({ url: "/trpc" }),
  ],
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={qc}>
      <QueryClientProvider client={qc}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
)
