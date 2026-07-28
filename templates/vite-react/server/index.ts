import { createHTTPServer } from "@trpc/server/adapters/standalone"
import cors from "cors"
import { appRouter } from "./router.js"

const port = Number(process.env.PORT ?? 2021)

createHTTPServer({
  router: appRouter,
  // The Vite dev server runs on a different origin, so the API has to allow it.
  middleware: cors(),
  createContext() {
    return {}
  },
}).listen(port)

console.log(`tRPC server listening on http://localhost:${port}`)
