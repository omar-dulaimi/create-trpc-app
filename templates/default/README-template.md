# tRPC app

A minimal end-to-end tRPC v11 setup:

- `src/server.ts`: an Express 5 server exposing a tRPC router at `/trpc`
- `src/client.ts`: a type-safe vanilla tRPC client that calls it from Node

Both halves share types through `export type AppRouter`, so renaming a
procedure on the server is a compile error in the client.

## Requirements

Node.js 22.12 or newer.

## Scripts

| Script               | What it does                                                       |
| :------------------- | :----------------------------------------------------------------- |
| `npm run dev`        | Runs the server and the client together, both watching for changes |
| `npm run dev:server` | Runs only the server on port 2021                                  |
| `npm run dev:client` | Waits for port 2021, then runs only the client                     |
| `npm run type-check` | Typechecks with no emit                                            |
| `npm run build`      | Bundles both entry points into `dist/` with esbuild                |
| `npm run test-dev`   | Starts the server, runs the client once, exits                     |
| `npm run test-start` | Builds, then does the same against the bundled output              |

`npm run test-dev` is the quickest way to confirm the whole thing works: it
prints the created post, the post list, the admin secret and the message list,
then exits 0.

## Where to go next

- The router lives in `src/server.ts`. Add procedures to `appRouter`.
- Validation uses [Zod](https://zod.dev). Any
  [Standard Schema](https://standardschema.dev) validator works too.
- Swap Express for another adapter (Fastify, standalone, Next.js, AWS Lambda,
  Fetch) without touching the router: <https://trpc.io/docs/server/adapters>
