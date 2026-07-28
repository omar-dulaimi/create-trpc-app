import { createTRPCContext } from "@trpc/tanstack-react-query"
import type { AppRouter } from "../server/router"

/**
 * The TanStack React Query integration, which is what tRPC recommends for new
 * React projects. `useTRPC()` returns a proxy that produces plain TanStack
 * Query options objects, so you call native `useQuery`/`useMutation` with them.
 */
export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()

/** Where the tRPC server from `server/index.ts` is listening. */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:2021"
