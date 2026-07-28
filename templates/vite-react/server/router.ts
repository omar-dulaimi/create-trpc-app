import { z } from "zod"
import { publicProcedure, router } from "./trpc.js"

const messages: string[] = ["Hello from tRPC"]

export const appRouter = router({
  greeting: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query((opts) => `Hello ${opts.input?.name ?? "world"}!`),

  messages: {
    list: publicProcedure.query(() => messages),
    add: publicProcedure.input(z.string().min(1)).mutation((opts) => {
      messages.push(opts.input)
      return messages
    }),
  },
})

// This type is the only thing the browser bundle imports from the server.
export type AppRouter = typeof appRouter
