import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "../../../../server/router"

/**
 * The App Router uses the Fetch adapter. `@trpc/server/adapters/next` is for
 * the Pages Router only.
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  })
}

export { handler as GET, handler as POST }
