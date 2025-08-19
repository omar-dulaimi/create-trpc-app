import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  hello: t.procedure.input(z.object({ name: z.string().optional() })).query(({ input }) => `Hello ${input?.name ?? 'world'}!`),
});

export type AppRouter = typeof appRouter;
