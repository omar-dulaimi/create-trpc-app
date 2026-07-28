# tRPC + Vite + React

A two-process setup:

- `server/`: a standalone tRPC v11 server on port 2021
- `src/`: a Vite + React 19 single-page app that calls it

The React side uses
[`@trpc/tanstack-react-query`](https://trpc.io/docs/client/tanstack-react-query/setup),
the integration tRPC recommends for new projects. `useTRPC()` returns a proxy
that builds plain TanStack Query options objects, so call sites use the native
`useQuery`/`useMutation` hooks:

```tsx
const greeting = useQuery(trpc.greeting.queryOptions({ name: "tRPC user" }))
const addMessage = useMutation(trpc.messages.add.mutationOptions())
```

## Requirements

Node.js 22.12 or newer.

## Scripts

| Script                 | What it does                                    |
| :--------------------- | :---------------------------------------------- |
| `npm run dev`          | Runs the API and the Vite dev server together   |
| `npm run dev:server`   | Runs only the API on port 2021                  |
| `npm run dev:client`   | Runs only Vite on port 5173                     |
| `npm run type-check`   | Typechecks client and server together           |
| `npm run build`        | Typechecks, then builds the SPA into `dist/`    |
| `npm run preview`      | Serves the built SPA (start the API separately) |
| `npm run start:server` | Runs the API once, without watch mode           |

Then open <http://localhost:5173>.

## Notes

- The browser talks to the API across origins, so `server/index.ts` enables
  CORS. Point the client somewhere else with `VITE_API_URL`.
- `src/` imports only `import type { AppRouter }` from `server/`, so no server
  code is ever bundled into the browser build.
