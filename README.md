<div align="center">
  <a href="https://github.com/omar-dulaimi/create-trpc-app">
    <img src="https://raw.githubusercontent.com/omar-dulaimi/create-trpc-app/master/logo.png" alt="Logo" width="120" height="120" />
  </a>

  <h1>Create tRPC App</h1>
  <p>Scaffold a new tRPC app or run any public tRPC example from GitHub — fast, reliable, workspace‑aware.</p>

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

```bash
# Interactive scaffold
npx create-trpc-appx@latest my-app

# Scaffold from a bundled template
npx create-trpc-appx@latest my-app --example nextjs-app

# Run an example from GitHub (no scaffold)
create-trpc-appx run trpc/trpc-openapi#master --example-path examples/with-nextjs --prepare-only
```

Tip: add `--yes` to skip prompts. Use `--verbose` for debug logs.

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
  <sub>Thanks for your support — it helps keep this project healthy and moving forward.</sub>
  
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
| `-e, --example [name\|github-url]` | string | —       | Use a bundled template or a GitHub URL                            |
| `--example-path <path>`            | string | —       | Required when branch contains a slash or to target a subdirectory |
| `--use-npm` / `--use-pnpm`         | flag   | auto    | Prefer a package manager                                          |
| `--yes`                            | flag   | false   | Skip prompts                                                      |
| `--verbose`                        | flag   | false   | Extra logs                                                        |

### Run options (by feature)

<details>
  <summary><b>Environment & Ports</b></summary>

| Option              | Type       | Default   | Description                                   |
| :------------------ | :--------- | :-------- | :-------------------------------------------- |
| `--env KEY=VALUE`   | repeatable | —         | Inline env vars to pass                       |
| `--env-file <path>` | string     | —         | Load env vars from file                       |
| `--port <number>`   | number     | —         | Set PORT                                      |
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

You can pass `--use-npm` or `--use-pnpm` with `run` as well. The runner otherwise detects npm/yarn/pnpm via lockfiles and `packageManager` fields and installs at the appropriate workspace root when needed.

</details>

## Templates

| Name         | Stack                              |
| :----------- | :--------------------------------- |
| `default`    | Node + tRPC server + simple client |
| `nextjs-app` | Next.js App Router + tRPC          |
| `vite-react` | Vite + React + tRPC                |

Use during scaffold with `--example <name>` or point to any GitHub example URL.

## Run examples from GitHub

```bash
# Full URL with subdirectory
create-trpc-appx run https://github.com/trpc/trpc-openapi/tree/master/examples/with-nextjs --prepare-only

# Short/SSH forms and explicit example-path
create-trpc-appx run trpc/trpc-openapi#master --example-path examples/with-nextjs
```

The runner caches archives, verifies checksums, retries transient failures, and falls back to `git clone` when necessary. The cache can be safely removed at any time.

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

- engines.node mismatch → use nvm/Volta to switch versions
- behind a proxy → set `HTTP_PROXY`/`HTTPS_PROXY`
- private repos or higher rate limits → set `GITHUB_TOKEN`
- no runnable scripts found → check `package.json` scripts or pass `--script`

Run diagnostics:

```bash
create-trpc-appx doctor
```

</details>

## Security

This CLI can download and run third‑party code. Review sources before running unfamiliar examples. Prefer a sandboxed/test environment when exploring.

## Contributing

Contributions welcome—PRs and issues appreciated.

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
