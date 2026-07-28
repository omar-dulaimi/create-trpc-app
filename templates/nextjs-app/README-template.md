# tRPC + Next.js App Router

A single Next.js app that serves both the UI and the tRPC API:

- `src/server/router.ts`: the tRPC v11 router
- `src/app/api/trpc/[trpc]/route.ts`: the route handler, using the **Fetch**
  adapter (`@trpc/server/adapters/next` is for the Pages Router only)
- `src/trpc/client.tsx`: the client component that wires up
  `QueryClientProvider` and `TRPCProvider`
- `src/app/page.tsx`: a client component reading data through `useTRPC()`

The React side uses
[`@trpc/tanstack-react-query`](https://trpc.io/docs/client/tanstack-react-query/setup),
the integration tRPC recommends for new projects.

## Requirements

Node.js 22.12 or newer.

## Scripts

| Script               | What it does                                     |
| :------------------- | :----------------------------------------------- |
| `npm run dev`        | Starts the dev server on <http://localhost:3000> |
| `npm run type-check` | Typechecks with no emit                          |
| `npm run build`      | Production build                                 |
| `npm start`          | Serves the production build (run `build` first)  |

Note: `npm run type-check` needs the Next.js type files, so run `npm run dev`
or `npm run build` at least once first. `next build` typechecks on its own.

## Verify the API directly

```bash
curl 'http://localhost:3000/api/trpc/greeting?input=%7B%22name%22%3A%22curl%22%7D'
```

## Where to go next

- Add procedures to `appRouter` in `src/server/router.ts`.
- Server Components can call the router directly, or prefetch into the query
  cache: <https://trpc.io/docs/client/tanstack-react-query/server-components>
