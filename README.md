<div align="center">
  <a href="https://github.com/omar-dulaimi/create-trpc-app">
    <img src="https://raw.githubusercontent.com/omar-dulaimi/create-trpc-app/master/logo.png" alt="Logo" width="120" height="120" />
  </a>

  <h1>Create tRPC App</h1>
  <p>Scaffold a new tRPC app or run any public tRPC example from GitHub: fast, reliable, workspace-aware.</p>

  <p>
    <a href="#quick-start">🚀 Quick start</a> ·
    <a href="#features">✨ Features</a> ·
    <a href="#commands">🧰 Commands</a> ·
    <a href="#options">⚙️ Options</a> ·
    <a href="#templates">📦 Templates</a> ·
    <a href="#monorepos--script-detection">🧭 Monorepos</a> ·
  <a href="#troubleshooting">🩺 Troubleshooting</a> ·
  <a href="#support-the-project">🌟 Star & Sponsor</a>
  </p>
</div>

## Quick start

Requires Node.js 22.12 or newer.

```bash
# Interactive scaffold (pass a name or answer the prompt)
npx create-trpc-appx@latest my-app
# or just:
npx create-trpc-appx@latest

# Scaffold from a bundled template
npx create-trpc-appx@latest my-app --example nextjs-app
npx create-trpc-appx@latest my-app --example vite-react

# Scaffold from an official tRPC example (any directory in trpc/trpc examples/)
npx create-trpc-appx@latest my-app --example minimal

# Run an example from GitHub without scaffolding
npx create-trpc-appx@latest run trpc/trpc#main --example-path examples/minimal --prepare-only
```

Then:

```bash
cd my-app
npm run dev
```

Everything the CLI scaffolds targets **tRPC v11** (currently 11.18.0).

## Support the project

If this project helps you, please consider:

- Starring the repo
- Sponsoring on GitHub to support maintenance

<p align="center">
  <a href="https://github.com/omar-dulaimi/create-trpc-app/stargazers">
    <img src="./assets/buttons/star.svg" alt="Star this project on GitHub" width="220" height="56" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/sponsors/omar-dulaimi">
    <img src="./assets/buttons/sponsor.svg" alt="Sponsor on GitHub" width="240" height="56" />
  </a>

  <br/>
  <sub>Thanks for your support. It helps keep this project healthy and moving forward.</sub>

  <!-- If the above images don't render on npm, GitHub will still display them. -->
  <!-- Fallback text links: -->
  <br/>
  <a href="https://github.com/omar-dulaimi/create-trpc-app/stargazers">Star on GitHub</a>
  ·
  <a href="https://github.com/sponsors/omar-dulaimi">Sponsor via GitHub Sponsors</a>

</p>

## Features

|  ⚡ | What            | Details                                                      |
| --: | :-------------- | :----------------------------------------------------------- |
|  🚀 | Fast builds     | ESM output via tsup                                          |
|  🧠 | Smart scripts   | Framework heuristics: dev → start/preview → build            |
|  🧭 | Workspace‑aware | Detects npm/yarn/pnpm workspaces and picks the right package |
|  🛰️ | Robust runner   | Cache, offline mode, retries, checksum verification          |
|  🔌 | Env/Ports       | Inline env, env-file, fixed/auto ports                       |

## Commands

| Command                             | Purpose                                                  |
| :---------------------------------- | :------------------------------------------------------- |
| `create-trpc-appx`                  | Interactive scaffold for a new app                       |
| `create-trpc-appx doctor`           | Diagnose Node, package managers, git, proxy, and network |
| `create-trpc-appx info [dir]`       | Show scripts, workspaces, engines for a project          |
| `create-trpc-appx run <github-url>` | Fetch, prepare, and run a public example from GitHub     |

## Options

### Scaffold options

| Option                             | Type   | Default | Description                                                       |
| :--------------------------------- | :----- | :------ | :---------------------------------------------------------------- |
| `-e, --example [name\|github-url]` | string | default | Bundled template name, official tRPC example name, or GitHub URL  |
| `--example-path <path>`            | string | none    | Required when branch contains a slash or to target a subdirectory |
| `--use-npm` / `--use-pnpm`         | flag   | auto    | Prefer a package manager                                          |
| `--yes`                            | flag   | false   | Skip prompts                                                      |
| `--verbose`                        | flag   | false   | Extra logs                                                        |

Root options must come before a subcommand name, and subcommand options after
it: `create-trpc-appx run <url> --example-path <dir>`.

### Run options (by feature)

<details>
  <summary><b>Environment & Ports</b></summary>

| Option              | Type       | Default   | Description                                   |
| :------------------ | :--------- | :-------- | :-------------------------------------------- |
| `--env KEY=VALUE`   | repeatable | none      | Inline env vars to pass                       |
| `--env-file <path>` | string     | none      | Load env vars from file                       |
| `--port <number>`   | number     | none      | Set PORT                                      |
| `--auto-port`       | flag       | false     | Find a free port starting at `--port` or 3000 |
| `--script <name>`   | string     | heuristic | Force a specific script                       |

</details>

<details>
  <summary><b>Networking & Cache</b></summary>

| Option               | Type   | Default   | Description                                               |
| :------------------- | :----- | :-------- | :-------------------------------------------------------- |
| `--offline`          | flag   | false     | Use cache only (no network)                               |
| `--no-cache`         | flag   | false     | Disable cache and force re‑download                       |
| `--cache-dir <path>` | string | XDG cache | Use a custom cache dir                                    |
| `--prepare-only`     | flag   | false     | Download/extract (and optionally install) without running |
| `--no-install`       | flag   | false     | Skip dependency installation                              |

</details>

<details>
  <summary><b>Build & Scripts</b></summary>

| Option              | Type                      | Default | Description                              |
| :------------------ | :------------------------ | :------ | :--------------------------------------- |
| `--prebuild <mode>` | `auto`\|`always`\|`never` | `auto`  | Prebuild before `start` when appropriate |

Heuristics: Next.js/Remix/SolidStart → `dev` → `start` → `build`; Vite/Astro/SvelteKit → `dev` → `preview` → `start`.

</details>

<!-- Telemetry removed in 2025-08 -->

<details>
  <summary><b>Package manager</b></summary>

You can pass `--use-npm`, `--use-pnpm` or `--use-yarn` with `run` as well. The runner otherwise detects npm/yarn/pnpm via lockfiles and `packageManager` fields and installs at the appropriate workspace root when needed.

</details>

## Templates

Three templates ship inside the package, so they work with no network access to
GitHub. All three are on tRPC v11 and are verified to build and run in CI.

| Name         | Stack                                                           | Ports      |
| :----------- | :-------------------------------------------------------------- | :--------- |
| `default`    | Express 5 + tRPC server, vanilla tRPC client in Node            | 2021       |
| `vite-react` | Standalone tRPC server + Vite 8 / React 19 SPA                  | 2021, 5173 |
| `nextjs-app` | Next.js 16 App Router, tRPC via the Fetch adapter route handler | 3000       |

The React templates use
[`@trpc/tanstack-react-query`](https://trpc.io/docs/client/tanstack-react-query/setup),
the integration tRPC recommends for new projects. The older
`@trpc/react-query` package is now labelled "Classic" upstream.

```bash
npx create-trpc-appx@latest my-app                      # default
npx create-trpc-appx@latest my-app --example vite-react
npx create-trpc-appx@latest my-app --example nextjs-app
```

The template's own `package.json` decides which versions get installed. There is
no second, hidden dependency list in the CLI.

### Official tRPC examples

Any directory name from
[`trpc/trpc/examples`](https://github.com/trpc/trpc/tree/main/examples) works
too, and is fetched at scaffold time:

```bash
npx create-trpc-appx@latest my-app --example minimal
npx create-trpc-appx@latest my-app --example express-minimal
npx create-trpc-appx@latest my-app --example fastify-server
```

Note that the headline starters `next-prisma-starter`, `next-prisma-todomvc`,
`next-prisma-websockets-starter` and `kitchen-sink` now live in their own
`trpc/examples-*` repositories, so reach them by URL instead:

```bash
npx create-trpc-appx@latest my-app \
  --example https://github.com/trpc/examples-next-prisma-starter
```

## Run examples from GitHub

`run` fetches an example into a cache directory and starts it, without creating
a project you own. Use `--example` above if you want a project to keep.

```bash
# Short form plus an explicit subdirectory
npx create-trpc-appx@latest run trpc/trpc#main --example-path examples/minimal --prepare-only

# Full URL with the subdirectory in the path
npx create-trpc-appx@latest run https://github.com/trpc/trpc/tree/main/examples/minimal --prepare-only

# Drop --prepare-only to actually start it
npx create-trpc-appx@latest run trpc/trpc#main --example-path examples/express-minimal
```

The runner caches archives, verifies checksums, retries transient failures, and falls back to `git clone` when necessary. The cache can be safely removed at any time.

If the subdirectory you asked for is not in the repository, the command now
fails with `ERR_EXAMPLE_PATH` instead of quietly preparing the repository root.

## Monorepos & script detection

The runner scans workspaces (npm/yarn/pnpm) and common subfolders (apps/_, packages/_) to pick the best runnable directory based on scripts and naming.

The runner detects common frameworks (Next.js, Vite, Remix, Astro, SvelteKit, SolidStart) and picks the best script automatically:

- Next.js, Remix, SolidStart: prefers `dev`, then `start`, then `build`.
- Vite, Astro, SvelteKit: prefers `dev`, then `preview`, then `start`.
- Prebuild is triggered for `preview`/`start` if a `build` script exists (Vite/Astro/SvelteKit), or for `start` when `build` exists (Next.js/Remix/SolidStart).

<details>
  <summary>Heuristics</summary>

1. If current dir has a runnable script → use it.

2. If workspace root → expand workspace globs and pick the best candidate based on:
   - script presence: `dev` > `preview` > `start` > `build`
   - directory hints: `examples`, `app`, `web`, `site`, `server`, `api`

3. Otherwise, scan first two levels for runnable packages.

</details>

<!-- Telemetry section removed in 2025-08 -->

## Troubleshooting

<details>
  <summary>Common issues</summary>

- engines.node mismatch → use nvm/Volta to switch versions; this CLI needs Node 22.12+
- behind a proxy → set `HTTP_PROXY`/`HTTPS_PROXY`
- private repos or higher rate limits → set `GITHUB_TOKEN`
- no runnable scripts found → check `package.json` scripts or pass `--script`
- `ERR_EXAMPLE_PATH` from `run` → the `--example-path` subdirectory is not in that repository at that branch
- `Could not locate an example named "..."` → the name is not a directory in [trpc/trpc/examples](https://github.com/trpc/trpc/tree/main/examples); the error lists the bundled templates, which always work offline

If you see `error: unknown command 'my-app'` when running `npx create-trpc-appx my-app`, you're likely on an older CLI that didn't accept a positional project name at the root. Update to the latest version or run without the name and answer the prompt:

```bash
npx create-trpc-appx@latest
```

Run diagnostics:

```bash
npx create-trpc-appx@latest doctor
```

</details>

## Security

This CLI can download and run third‑party code. Review sources before running unfamiliar examples. Prefer a sandboxed/test environment when exploring.

Third-party archives are extracted with [`tar`](https://www.npmjs.com/package/tar) `^7.5.22`, the first release line with no open advisories. Earlier 7.x releases, including the 7.5.7 that fixes GHSA-34x7-hfp2-rc4v alone, still carry others.

## Development

```bash
npm ci
npm run build       # bundle to dist/ and copy templates
npm run typecheck   # tsc --noEmit
npm run lint        # eslint, zero warnings tolerated
npm test            # build, then unit + template contract tests
npm run test:smoke  # `run` subcommand against real GitHub repos (needs network)

# End-to-end against the PACKAGED artifact: npm pack, install the tarball into
# an empty directory, scaffold from that install, then build/run the result.
node tests/scaffold.test.mjs              # all three templates
node tests/scaffold.test.mjs nextjs-app   # just one
```

`npm test` is offline. `npm run test:smoke` and `tests/scaffold.test.mjs` reach the network; set `GITHUB_TOKEN` to avoid GitHub API rate limits.

`tests/scaffold.test.mjs` needs ports 2021 (default template) free.

## Contributing

Contributions welcome. PRs and issues appreciated.

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

This project has been based on Create Next App, so a huge thank you goes to every and single one who worked on it.

Attribution for one of the icons used in the logo: <a href="https://www.flaticon.com/free-icons/design" title="design icons">Design icons created by monkik - Flaticon</a>

## License

Licensed under MIT.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[contributors-url]: https://github.com/omar-dulaimi/create-trpc-app/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[forks-url]: https://github.com/omar-dulaimi/create-trpc-app/network/members
[stars-url]: https://github.com/omar-dulaimi/create-trpc-app/stargazers
[issues-shield]: https://img.shields.io/github/issues/omar-dulaimi/create-trpc-app.svg?style=for-the-badge
[issues-url]: https://github.com/omar-dulaimi/create-trpc-app/issues
[license-shield]: https://img.shields.io/github/license/omar-dulaimi/create-trpc-app?style=for-the-badge
[license-url]: https://github.com/omar-dulaimi/create-trpc-app/blob/master/LICENSE
