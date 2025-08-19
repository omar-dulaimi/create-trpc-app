import ora from "ora"
// Detect .env* files and print usage hint
export function printEnvFileHint(cwd: string) {
  const files = fs.readdirSync(cwd).filter((f) => /^\.env/.test(f))
  if (files.length > 0) {
    console.log(
      chalk.yellow(
        `Hint: Detected ${files.join(", ")}. Use --env-file to pass environment variables to the example.`
      )
    )
  }
}
// Detect workspace root and navigate to correct subpackage
export function findWorkspaceRoot(startDir: string): string | null {
  let dir = startDir
  for (let i = 0; i < 5; i++) {
    const pkg = readPkgJson(dir)
    if (!pkg) {
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
      continue
    }
    if (pkg.workspaces || pkg.packages) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export function findWorkspaceSubpackage(root: string, target: string): string | null {
  const pkg = readPkgJson(root)
  const patterns = pkg?.workspaces || pkg?.packages
  if (!patterns) return null
  const candidates = expandWorkspaceGlobs(root, patterns)
  for (const c of candidates) {
    if (c.endsWith(target)) return c
  }
  return null
}
// Framework detection utility
export function detectFramework(
  cwd: string
): "next" | "vite" | "remix" | "astro" | "sveltekit" | "solidstart" | null {
  try {
    const pkg = readPkgJson(cwd)
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
    if (!deps) return null
    if (
      deps["next"] ||
      deps["@next/env"] ||
      deps["@next/core"] ||
      deps["@next/server"] ||
      deps["@next/types"] ||
      deps["@next/swc"] ||
      deps["@next/react"] ||
      deps["@next/font"] ||
      deps["@next/image"]
    )
      return "next"
    if (
      deps["vite"] ||
      deps["@vitejs/plugin-react"] ||
      deps["@vitejs/plugin-vue"] ||
      deps["@vitejs/plugin-svelte"] ||
      deps["@vitejs/plugin-solid"] ||
      deps["@vitejs/plugin-legacy"] ||
      deps["@vitejs/plugin-check"] ||
      deps["@vitejs/plugin-pwa"]
    )
      return "vite"
    if (
      deps["@remix-run/core"] ||
      deps["@remix-run/react"] ||
      deps["@remix-run/node"] ||
      deps["@remix-run/serve"] ||
      deps["@remix-run/dev"] ||
      deps["remix"] ||
      deps["remix-run"] ||
      deps["remix-app"] ||
      deps["remix-server"] ||
      deps["remix-react"] ||
      deps["remix-node"]
    )
      return "remix"
    if (
      deps["astro"] ||
      deps["@astrojs/core"] ||
      deps["@astrojs/renderer-react"] ||
      deps["@astrojs/renderer-vue"] ||
      deps["@astrojs/renderer-svelte"] ||
      deps["@astrojs/renderer-solid"] ||
      deps["@astrojs/renderer-preact"] ||
      deps["@astrojs/renderer-lit"] ||
      deps["@astrojs/renderer-markdown"] ||
      deps["@astrojs/renderer-mdx"]
    )
      return "astro"
    if (
      deps["@sveltejs/kit"] ||
      deps["sveltekit"] ||
      deps["svelte"] ||
      deps["@sveltejs/adapter-node"] ||
      deps["@sveltejs/adapter-static"] ||
      deps["@sveltejs/adapter-vercel"] ||
      deps["@sveltejs/adapter-cloudflare"] ||
      deps["@sveltejs/adapter-netlify"] ||
      deps["@sveltejs/adapter-auto"] ||
      deps["@sveltejs/adapter-bun"] ||
      deps["@sveltejs/adapter-deno"] ||
      deps["@sveltejs/adapter-aws"] ||
      deps["@sveltejs/adapter-firebase"] ||
      deps["@sveltejs/adapter-github"] ||
      deps["@sveltejs/adapter-heroku"] ||
      deps["@sveltejs/adapter-now"] ||
      deps["@sveltejs/adapter-render"] ||
      deps["@sveltejs/adapter-static"] ||
      deps["@sveltejs/adapter-vercel"] ||
      deps["@sveltejs/adapter-cloudflare"] ||
      deps["@sveltejs/adapter-netlify"] ||
      deps["@sveltejs/adapter-auto"] ||
      deps["@sveltejs/adapter-bun"] ||
      deps["@sveltejs/adapter-deno"] ||
      deps["@sveltejs/adapter-aws"] ||
      deps["@sveltejs/adapter-firebase"] ||
      deps["@sveltejs/adapter-github"] ||
      deps["@sveltejs/adapter-heroku"] ||
      deps["@sveltejs/adapter-now"] ||
      deps["@sveltejs/adapter-render"]
    )
      return "sveltekit"
    if (
      deps["solid-start"] ||
      deps["@solidjs/start"] ||
      deps["@solidjs/router"] ||
      deps["@solidjs/meta"] ||
      deps["@solidjs/cli"] ||
      deps["@solidjs/testing"] ||
      deps["@solidjs/dev"] ||
      deps["@solidjs/types"] ||
      deps["@solidjs/webpack"] ||
      deps["@solidjs/babel"] ||
      deps["@solidjs/eslint-plugin"] ||
      deps["@solidjs/tsconfig"] ||
      deps["@solidjs/vite-plugin"] ||
      deps["@solidjs/rollup-plugin"] ||
      deps["@solidjs/webpack-plugin"] ||
      deps["@solidjs/parcel-plugin"] ||
      deps["@solidjs/cli"] ||
      deps["@solidjs/testing"] ||
      deps["@solidjs/dev"] ||
      deps["@solidjs/types"] ||
      deps["@solidjs/webpack"] ||
      deps["@solidjs/babel"] ||
      deps["@solidjs/eslint-plugin"] ||
      deps["@solidjs/tsconfig"] ||
      deps["@solidjs/vite-plugin"] ||
      deps["@solidjs/rollup-plugin"] ||
      deps["@solidjs/webpack-plugin"] ||
      deps["@solidjs/parcel-plugin"]
    )
      return "solidstart"
    return null
  } catch {
    return null
  }
}
/* eslint-disable import/no-extraneous-dependencies */
import retry from "async-retry"
import chalk from "chalk"
import { spawn } from "child_process"
import crypto from "crypto"
import fs from "fs"
import got from "got"
import net from "net"
import os from "os"
import path from "path"
import semver from "semver"
import { pipeline } from "stream/promises"
import * as tar from "tar"
import { PackageManager } from "./get-pkg-manager.js"

export type RunOptions = {
  githubUrl: string
  // If current dir runnable, use it
  examplePath?: string
  script?: string // preferred script to run; default dev
  port?: number
  install: boolean
  offline: boolean
  cache: boolean
  cacheDir?: string
  envVars?: Record<string, string>
  prepareOnly?: boolean
  autoPort?: boolean
  prebuildMode?: "auto" | "always" | "never"
  packageManager?: string
}

// --- Plugin API ---
export interface RunnerPlugin {
  beforeDetect?: (cwd: string, pkg: any) => void
  detect?: (cwd: string, pkg: any) => string | null
  run?: (opts: RunOptions, context: any) => Promise<boolean>
  afterRun?: (opts: RunOptions, context: any, result: boolean) => void
}

const plugins: RunnerPlugin[] = []

export function registerRunnerPlugin(plugin: RunnerPlugin) {
  plugins.push(plugin)
}

function runDetectionHooks(cwd: string, pkg: any): string | null {
  for (const plugin of plugins) {
    if (plugin.beforeDetect) plugin.beforeDetect(cwd, pkg)
    if (plugin.detect) {
      const result = plugin.detect(cwd, pkg)
      if (result) return result
    }
  }
  return null
}

async function runExecutionHooks(opts: RunOptions, context: any): Promise<boolean> {
  for (const plugin of plugins) {
    let handled = false
    if (plugin.run) {
      handled = await plugin.run(opts, context)
      if (plugin.afterRun) plugin.afterRun(opts, context, handled)
      if (handled) return true
    }
  }
  return false
}

// --- Error Types & Central Handler ---
export class RunnerError extends Error {
  code: string
  details?: any
  constructor(message: string, code: string = "ERR_RUNNER", details?: any) {
    super(message)
    this.code = code
    this.details = details
  }
}

export class NetworkError extends RunnerError {
  constructor(message: string, details?: any) {
    super(message, "ERR_NETWORK", details)
  }
}

export class DownloadError extends RunnerError {
  constructor(message: string, details?: any) {
    super(message, "ERR_DOWNLOAD", details)
  }
}

export class ScriptError extends RunnerError {
  constructor(message: string, details?: any) {
    super(message, "ERR_SCRIPT", details)
  }
}

export function handleRunnerError(err: unknown) {
  if (err instanceof RunnerError) {
    console.error(chalk.red(`[${err.code}] ${err.message}`))
    if (err.details) console.error(chalk.gray(JSON.stringify(err.details, null, 2)))
  } else if (err instanceof Error) {
    console.error(chalk.red(`[ERR_UNKNOWN] ${err.message}`))
  } else {
    console.error(chalk.red(`[ERR_UNKNOWN] ${String(err)}`))
  }
}
// Spinner utility
export function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = ora(text).start()
  return fn()
    .then((result) => {
      spinner.succeed()
      return result
    })
    .catch((err) => {
      spinner.fail()
      // Print actionable error hint
      if (err instanceof RunnerError) {
        if (err.code === "ERR_NETWORK") {
          console.error(chalk.yellow("Hint: Check your internet connection or proxy settings."))
        } else if (err.code === "ERR_DOWNLOAD") {
          console.error(chalk.yellow("Hint: The example repo may not exist or is private."))
        } else if (err.code === "ERR_SCRIPT") {
          console.error(chalk.yellow("Hint: Check the example's scripts and dependencies."))
        }
      }
      throw err
    })
}
// ...existing code...

export function parseGitHub(
  url: string,
  examplePath?: string
): {
  owner: string
  repo: string
  branch: string
  subdir: string
} {
  // Normalize to https URL
  let href = url.trim()

  // SSH form: git@github.com:owner/repo(.git)
  const ssh =
    /^git@github.com:(?<owner>[^/]+)\/(?<repo>[^#?]+?)(?:\.git)?(?:#(?<branch>[^?]+))?(?:\?(?<query>.*))?$/
  const short = /^(?<owner>[^/]+)\/(?<repo>[^#?]+?)(?:#(?<branch>[^?]+))?$/
  const mSsh = href.match(ssh)
  if (mSsh?.groups) {
    href = `https://github.com/${mSsh.groups.owner}/${mSsh.groups.repo}${mSsh.groups.branch ? `/tree/${mSsh.groups.branch}` : ""}`
  } else if (short.test(href) && !href.startsWith("http")) {
    const m = href.match(short)!
    href = `https://github.com/${m!.groups!.owner}/${m!.groups!.repo}${m!.groups!.branch ? `/tree/${m!.groups!.branch}` : ""}`
  }
  const u = new URL(href)
  if (u.hostname !== "github.com") throw new Error("Only GitHub URLs are supported.")
  const parts = u.pathname.replace(/^\//, "").split("/")
  const owner = parts[0]
  const repo = parts[1]
  let branch = "main"
  let subdir = ""
  if (parts[2] === "tree") {
    branch = parts[3] ?? "main"
    subdir = parts.slice(4).join("/")
  }
  if (examplePath) subdir = examplePath.replace(/^\//, "")
  if (!owner || !repo) throw new Error("Invalid GitHub URL format.")
  return { owner, repo, branch, subdir }
}

function xdgCacheDir(custom?: string): string {
  if (custom) return path.resolve(custom)
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
  return path.join(base, "create-trpc-appx")
}

function getCacheTTL(): number {
  // Try config file
  try {
    const configPath = path.join(os.homedir(), ".config", "create-trpc-app", "config.json")
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"))
      if (typeof cfg.cacheTTL === "number" && cfg.cacheTTL > 0) return cfg.cacheTTL
    }
  } catch {}
  return 7 * 24 * 60 * 60 * 1000 // 7 days in ms
}

async function ensureCacheDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })
}

export async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256")
    const rs = fs.createReadStream(filePath)
    rs.on("error", reject)
    hash.on("error", reject)
    rs.on("data", (chunk) => hash.update(chunk as any))
    rs.on("end", () => resolve(hash.digest("hex")))
  })
}

function readPkgJson(dir: string): any | null {
  try {
    const raw = fs.readFileSync(path.join(dir, "package.json"), "utf8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function listDirs(p: string): string[] {
  try {
    return fs
      .readdirSync(p, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(p, e.name))
  } catch {
    return []
  }
}

function expandWorkspaceGlobs(root: string, patterns: string[]): string[] {
  const out = new Set<string>()
  for (const pat of patterns) {
    if (typeof pat !== "string") continue
    if (pat.endsWith("/*")) {
      const base = path.join(root, pat.slice(0, -2))
      for (const d of listDirs(base)) out.add(d)
    } else if (pat.includes("*")) {
      // naive single-level fallback for patterns like packages/*/examples -> handle first segment
      const segs = pat.split("/")
      const idx = segs.indexOf("*")
      if (idx >= 0) {
        const pre = segs.slice(0, idx).join("/")
        const suf = segs.slice(idx + 1).join("/")
        const preAbs = path.join(root, pre)
        for (const mid of listDirs(preAbs)) {
          const cand = path.join(mid, suf)
          if (fs.existsSync(cand)) out.add(cand)
        }
      }
    } else {
      const abs = path.join(root, pat)
      if (fs.existsSync(abs)) out.add(abs)
    }
  }
  return Array.from(out)
}

function hasRunnableScript(dir: string): {
  runnable: boolean
  which: "dev" | "start" | "preview" | "build" | null
} {
  try {
    const pkg = readPkgJson(dir)
    const scripts = pkg?.scripts || {}
    // Framework-specific heuristics
    if (scripts.dev) return { runnable: true, which: "dev" }
    if (scripts.preview) return { runnable: true, which: "preview" }
    if (scripts.start) return { runnable: true, which: "start" }
    if (scripts.build) return { runnable: true, which: "build" }
    return { runnable: false, which: null }
  } catch {
    return { runnable: false, which: null }
  }
}

function hasBuildScript(dir: string): boolean {
  try {
    const pkg = readPkgJson(dir)
    return Boolean(pkg?.scripts?.build)
  } catch {
    return false
  }
}

export function shouldPrebuild(
  cwd: string,
  script: string,
  mode: "auto" | "always" | "never" = "auto"
): boolean {
  if (mode === "always") return true
  if (mode === "never") return false
  // auto: if we're going to run "start" and there's a build script, prebuild
  if (script === "start" && hasBuildScript(cwd)) return true
  return false
}

function scoreCandidate(dir: string): number {
  const bn = path.basename(dir).toLowerCase()
  let score = 0
  if (/(example|examples|demo)/.test(bn)) score += 5
  if (/(app|web|site)/.test(bn)) score += 3
  if (/(server|api)/.test(bn)) score += 2
  const runnable = hasRunnableScript(dir)
  if (runnable.which === "dev") score += 4
  if (runnable.which === "preview") score += 3
  if (runnable.which === "start") score += 2
  if (runnable.which === "build") score += 1
  return score
}

export async function resolveRunnableDir(base: string): Promise<string> {
  // If current dir runnable, use it
  const here = hasRunnableScript(base)
  if (here.runnable) return base

  const pkg = readPkgJson(base)
  // If workspace root, scan workspaces
  const wsPatterns: string[] | undefined = Array.isArray(pkg?.workspaces)
    ? pkg!.workspaces
    : pkg?.workspaces?.packages
  const cands: string[] = []
  if (wsPatterns && wsPatterns.length > 0) {
    const wsDirs = expandWorkspaceGlobs(base, wsPatterns)
    for (const d of wsDirs) {
      const r = hasRunnableScript(d)
      if (r.runnable) cands.push(d)
    }
  }
  // If not a workspace or nothing found, search first two levels
  if (cands.length === 0) {
    const level1 = listDirs(base)
    for (const d1 of level1) {
      if (hasRunnableScript(d1).runnable) cands.push(d1)
      for (const d2 of listDirs(d1)) {
        if (hasRunnableScript(d2).runnable) cands.push(d2)
      }
    }
  }
  if (cands.length === 0) return base // fallback to base, later code will warn
  cands.sort((a, b) => {
    const sa = scoreCandidate(a)
    const sb = scoreCandidate(b)
    return sb - sa || a.localeCompare(b)
  })
  return cands[0]
}

export function checkNodeEngine(cwd: string): { ok: boolean; required?: string; current: string } {
  const current = process.version.startsWith("v") ? process.version.slice(1) : process.version
  try {
    const pkg = readPkgJson(cwd)
    const range = pkg?.engines?.node as string | undefined
    if (!range) return { ok: true, current }
    const ok = semver.satisfies(semver.coerce(current) || current, range, {
      includePrerelease: true,
    })
    return { ok, required: range, current }
  } catch {
    return { ok: true, current }
  }
}

async function downloadArchive(owner: string, repo: string, ref: string, outPath: string) {
  await retry(
    async (bail, attempt) => {
      const src = `https://codeload.github.com/${owner}/${repo}/tar.gz/${ref}`
      const headers: Record<string, string> = {}
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
      if (token) headers.Authorization = `Bearer ${token}`
      try {
        await pipeline(
          got.stream(src, { headers, timeout: { request: 15000 } }),
          fs.createWriteStream(outPath)
        )
      } catch (e: any) {
        const status = e?.response?.statusCode as number | undefined
        const code = e?.code as string | undefined
        // If it's a 4xx other than 429, don't retry further
        if (status && status >= 400 && status < 500 && status !== 429) {
          return bail(e)
        }
        // Retry for ENOTFOUND, ECONNRESET, ECONNREFUSED, 429, 5xx
        if (
          code === "ENOTFOUND" ||
          code === "ECONNRESET" ||
          code === "ECONNREFUSED" ||
          status === 429 ||
          (status && status >= 500)
        ) {
          // let retry
        } else {
          // unknown error: bail
          return bail(e)
        }
        throw e
      }
    },
    {
      retries: 4,
      minTimeout: 2000,
      maxTimeout: 15000,
      factor: 2,
      onRetry: (e, attempt) => {
        const err = e as any
        console.log(
          chalk.yellow(
            `Retrying download (attempt ${attempt}) due to network error: ${err?.code || err?.response?.statusCode || err}`
          )
        )
      },
    }
  )
}

async function extractArchiveRobust(tarPath: string, dest: string): Promise<string> {
  // Efficient disk streaming: tar.extract streams from file to disk, limiting memory usage
  const extractDir = path.join(dest, "_extract")
  await fs.promises.rm(extractDir, { recursive: true, force: true })
  await fs.promises.mkdir(extractDir, { recursive: true })
  await tar.extract({ cwd: extractDir, file: tarPath })
  const entries = await fs.promises.readdir(extractDir, { withFileTypes: true })
  const top = entries.find((e) => e.isDirectory())
  if (!top) throw new Error("Archive did not contain a top-level directory")
  return path.join(extractDir, top.name)
}

async function cloneRepo(owner: string, repo: string, branch: string, dest: string) {
  await fs.promises.rm(dest, { recursive: true, force: true })
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "git",
      [
        "clone",
        "--depth=1",
        "--single-branch",
        "--branch",
        branch,
        `https://github.com/${owner}/${repo}.git`,
        dest,
      ],
      { stdio: "inherit", env: { ...process.env, GIT_ASKPASS: "true" } }
    )
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`git clone exited ${code}`))
    )
    child.on("error", reject)
  })
}

export function detectPackageManager(cwd: string): PackageManager {
  // 1) Lockfiles (most reliable)
  const has = (f: string) => fs.existsSync(path.join(cwd, f))
  if (has("package-lock.json")) return "npm"
  if (has("pnpm-lock.yaml")) return "pnpm"
  if (has("yarn.lock")) return "yarn"

  // 2) packageManager field & workspace constraints
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"))
    const pmField = pkg.packageManager as string | undefined
    const hasWorkspaces = !!pkg.workspaces
    const isPrivate = !!pkg.private
    if (hasWorkspaces && !isPrivate) return "npm" // yarn classic will error
    if (pmField?.startsWith("pnpm")) return "pnpm"
    if (pmField?.startsWith("yarn")) return "yarn"
    if (pmField?.startsWith("npm")) return "npm"
  } catch {}

  // 3) Default to npm to avoid yarn workspace pitfalls
  return "npm"
}

async function installDeps(cwd: string, pm: PackageManager) {
  const args = pm === "yarn" ? ["install"] : ["install"]
  await new Promise<void>((resolve, reject) => {
    const child = spawn(pm, args, {
      stdio: "inherit",
      cwd,
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" },
    })
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${pm} ${args.join(" ")} failed`))
    )
  })
}

export function chooseScript(cwd: string, preferred?: string): string | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"))
    const scripts = pkg.scripts || {}
    if (preferred && scripts[preferred]) return preferred
    // Framework-specific heuristics
    const fw = detectFramework(cwd)
    if (fw === "next") {
      if (scripts.dev) return "dev"
      if (scripts.start) return "start"
      if (scripts.build) return "build"
    }
    if (fw === "vite") {
      if (scripts.dev) return "dev"
      if (scripts.preview) return "preview"
      if (scripts.start) return "start"
    }
    if (fw === "remix") {
      if (scripts.dev) return "dev"
      if (scripts.start) return "start"
      if (scripts.build) return "build"
    }
    if (fw === "astro") {
      if (scripts.dev) return "dev"
      if (scripts.preview) return "preview"
      if (scripts.start) return "start"
    }
    if (fw === "sveltekit") {
      if (scripts.dev) return "dev"
      if (scripts.preview) return "preview"
      if (scripts.start) return "start"
    }
    if (fw === "solidstart") {
      if (scripts.dev) return "dev"
      if (scripts.start) return "start"
      if (scripts.build) return "build"
    }
    // Generic fallback
    if (scripts.dev) return "dev"
    if (scripts.start) return "start"
    return null
  } catch {
    return null
  }
}

async function runScript(
  cwd: string,
  pm: PackageManager,
  script: string,
  port?: number,
  extraEnv?: Record<string, string>
) {
  const env = { ...process.env, ...(extraEnv || {}) } as NodeJS.ProcessEnv
  if (port) env.PORT = String(port)
  if (pm === "yarn") {
    return spawn(pm, [script], { stdio: "inherit", cwd, env })
  }
  return spawn(pm, ["run", script], { stdio: "inherit", cwd, env })
}

export async function findFreePort(start: number, end = start + 100): Promise<number> {
  const tryPort = (port: number) =>
    new Promise<boolean>((resolve) => {
      const srv = net.createServer()
      srv.unref()
      srv.on("error", () => resolve(false))
      srv.listen(port, () => {
        srv.close(() => resolve(true))
      })
    })
  for (let p = start; p <= end; p++) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await tryPort(p)
    if (ok) return p
  }
  throw new Error(`No free port found between ${start}-${end}`)
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const srv = net.createServer()
    srv.unref()
    srv.on("error", () => resolve(false))
    srv.listen(port, () => {
      srv.close(() => resolve(true))
    })
  })
}

export async function runExample(opts: RunOptions) {
  const { owner, repo, branch, subdir } = parseGitHub(opts.githubUrl, opts.examplePath)
  const cacheDir = xdgCacheDir(opts.cacheDir)
  await ensureCacheDir(cacheDir)

  const key = `${owner}_${repo}_${branch}` + (subdir ? `_${subdir.replace(/[\/]/g, "_")}` : "")
  const workDir = path.join(cacheDir, "runs", key)
  const tarPath = path.join(cacheDir, `${owner}_${repo}_${branch}.tar.gz`)
  const checksumPath = `${tarPath}.sha256`

  if (opts.offline && !(await fs.promises.stat(tarPath).catch(() => null))) {
    throw new Error("Offline requested but no cached archive found.")
  }

  let rootDir: string | null = null
  if (!opts.offline) {
    try {
      let needDownload =
        opts.cache === false || !(await fs.promises.stat(tarPath).catch(() => null))
      if (!needDownload) {
        // Check cache TTL
        try {
          const stat = await fs.promises.stat(tarPath)
          const age = Date.now() - stat.mtimeMs
          const ttl = getCacheTTL()
          if (age > ttl) {
            console.log(
              chalk.yellow(
                `Cached archive is older than TTL (${Math.floor(ttl / 86400000)} days). Re-downloading…`
              )
            )
            needDownload = true
          }
        } catch {}
        // Verify checksum of cached tar
        if (!needDownload) {
          try {
            const actual = await sha256File(tarPath)
            const expected = (
              await fs.promises.readFile(checksumPath, "utf8").catch(() => null)
            )?.trim()
            if (!expected) {
              await fs.promises.writeFile(checksumPath, actual, "utf8")
            } else if (expected !== actual) {
              console.log(chalk.yellow("Cached archive checksum mismatch. Re-downloading…"))
              needDownload = true
            } else {
              console.log(chalk.dim("Using cached archive (checksum verified)."))
            }
          } catch {
            console.log(chalk.yellow("Could not verify cache integrity. Re-downloading…"))
            needDownload = true
          }
        }
      }

      if (needDownload) {
        console.log(chalk.cyan("Downloading example archive…"))
        await downloadArchive(owner, repo, branch, tarPath)
        try {
          const digest = await sha256File(tarPath)
          await fs.promises.writeFile(checksumPath, digest, "utf8")
        } catch {
          // non-fatal
        }
      }
      await fs.promises.rm(workDir, { recursive: true, force: true })
      await fs.promises.mkdir(workDir, { recursive: true })
      const top = await extractArchiveRobust(tarPath, workDir)
      rootDir = subdir ? path.join(top, subdir) : top
    } catch (e: any) {
      const status = e?.response?.statusCode as number | undefined
      const code = e?.code as string | undefined
      // If extract failed due to corrupt tar, remove bad cache for next run
      try {
        await fs.promises.rm(tarPath, { force: true })
        await fs.promises.rm(checksumPath, { force: true })
      } catch {}
      if (status === 403 || status === 429) {
        console.log(
          chalk.yellow(
            `GitHub rate limit or auth required (HTTP ${status}). Set GITHUB_TOKEN to increase limits. Falling back to git clone…`
          )
        )
      } else if (status && status >= 400 && status < 500) {
        console.log(
          chalk.yellow(`HTTP ${status} while fetching tarball. Falling back to git clone…`)
        )
      } else if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ECONNRESET") {
        console.log(
          chalk.yellow(`Network error (${code}) while fetching tarball. Falling back to git clone…`)
        )
      } else {
        console.log(chalk.yellow("Tarball fetch/extract failed, falling back to git clone…"))
      }
      await cloneRepo(owner, repo, branch, workDir)
      rootDir = subdir ? path.join(workDir, subdir) : workDir
    }
  } else {
    console.log(chalk.dim("Using cached archive (offline mode)."))
    await fs.promises.rm(workDir, { recursive: true, force: true })
    await fs.promises.mkdir(workDir, { recursive: true })
    let top: string
    try {
      // Verify cache before extraction in offline mode
      try {
        const actual = await sha256File(tarPath)
        const expected = (
          await fs.promises.readFile(checksumPath, "utf8").catch(() => null)
        )?.trim()
        if (expected && expected !== actual) {
          throw new Error("checksum mismatch")
        }
      } catch {
        throw new Error(
          "Cached archive failed checksum verification. Remove cache or run without --offline to refresh."
        )
      }
      top = await extractArchiveRobust(tarPath, workDir)
    } catch (e) {
      throw new Error(
        "Cached archive appears invalid or missing. Remove cache or run without --offline to refresh."
      )
    }
    rootDir = subdir ? path.join(top, subdir) : top
  }

  const cwdBase = rootDir!
  const cwd = await resolveRunnableDir(cwdBase)

  // Determine workspace root if any (walk up to cwdBase only)
  let wsRoot: string | null = null
  {
    let cur = cwd
    while (true) {
      const pkg = readPkgJson(cur)
      const hasWs = !!(pkg && (Array.isArray(pkg.workspaces) || pkg.workspaces?.packages))
      if (hasWs) {
        wsRoot = cur
        break
      }
      if (cur === cwdBase) break
      const parent = path.dirname(cur)
      if (parent === cur) break
      cur = parent
    }
  }

  const pm = opts.packageManager || detectPackageManager(wsRoot || cwd)
  // engines.node warning (suggest nvm/Volta when mismatch)
  const eng = checkNodeEngine(cwd)
  if (!eng.ok) {
    console.log(
      chalk.yellow(
        `Warning: engines.node not satisfied in ${cwd}. Required: ${eng.required}, current: v${eng.current}.\n` +
          `Hint: use nvm (nvm use) or Volta to switch Node versions.`
      )
    )
  }

  // Env hint: if there are .env* files and no envVars provided, suggest using --env-file
  if (!opts.envVars || Object.keys(opts.envVars).length === 0) {
    const envFiles = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.example",
      ".env.sample",
    ].filter((f) => fs.existsSync(path.join(cwd, f)))
    if (envFiles.length > 0) {
      const primary = envFiles.find((f) => f === ".env" || f === ".env.local") || envFiles[0]
      console.log(
        chalk.dim(
          `Found env file(s): ${envFiles.join(", ")}. You can pass them with --env-file ${primary} or inline with --env KEY=VALUE.`
        )
      )
    }
  }

  if (opts.install) {
    const installDir = wsRoot || cwd
    console.log(chalk.cyan(`Installing dependencies with ${pm} in ${installDir}…`))
    await installDeps(installDir, pm as import("./get-pkg-manager.js").PackageManager)
  }

  if (opts.prepareOnly) {
    console.log(chalk.green("Prepared example at:"), cwd)
    return
  }

  const script = chooseScript(cwd, opts.script)
  if (!script) {
    console.log(chalk.yellow("No runnable script found (dev/start)."))
    return
  }

  let chosenPort = opts.port
  if (opts.autoPort) {
    const base = chosenPort ?? 3000
    try {
      const free = await findFreePort(base)
      chosenPort = free
      if (chosenPort !== opts.port) {
        console.log(chalk.dim(`PORT ${opts.port ?? base} is busy. Using free PORT=${free}.`))
      }
    } catch (e) {
      console.log(
        chalk.yellow(`Could not find a free port starting at ${base}. Proceeding without PORT.`)
      )
    }
  }
  if (!opts.autoPort && typeof opts.port === "number") {
    const available = await isPortAvailable(opts.port)
    if (!available) {
      console.log(
        chalk.yellow(
          `PORT ${opts.port} appears to be in use. The example may fail to start. Tip: add --auto-port to choose a free port.`
        )
      )
    }
  }

  if (opts.envVars && Object.keys(opts.envVars).length > 0) {
    const redacted = Object.entries(opts.envVars).map(([k, v]) => {
      const masked =
        v.length <= 4 ? "****" : `${"*".repeat(Math.max(0, v.length - 4))}${v.slice(-4)}`
      return `${k}=${masked}`
    })
    console.log(chalk.dim(`Passing env: ${redacted.join(" ")}`))
  }

  // Optional prebuild step
  const prebuildMode = opts.prebuildMode ?? "auto"
  // Framework-specific prebuild heuristics
  let doPrebuild = shouldPrebuild(cwd, script, prebuildMode)
  const fw = detectFramework(cwd)
  if (prebuildMode === "auto" && fw) {
    // If running preview/start and build exists, prebuild for Vite/Astro/SvelteKit
    if ((script === "preview" || script === "start") && hasBuildScript(cwd)) {
      doPrebuild = true
    }
    // For Next.js, Remix, SolidStart: prebuild if running start and build exists
    if (
      (fw === "next" || fw === "remix" || fw === "solidstart") &&
      script === "start" &&
      hasBuildScript(cwd)
    ) {
      doPrebuild = true
    }
  }
  if (doPrebuild) {
    console.log(chalk.cyan("Running prebuild (build) script…"))
    await new Promise<void>((resolve, reject) => {
      const child = ((): ReturnType<typeof spawn> => {
        if (pm === "yarn") return spawn(pm, ["build"], { stdio: "inherit", cwd, env: process.env })
        return spawn(pm, ["run", "build"], { stdio: "inherit", cwd, env: process.env })
      })()
      child.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`build script exited with code ${code}`))
      )
      child.on("error", reject)
    })
  }
  console.log(chalk.bold(`Running ${pm} ${script} in ${cwd}`))
  console.log()
  if (!process.env.CTA_DISABLE_SECURITY_WARNING) {
    console.log(
      chalk.red.bold("Warning: You are about to run code downloaded from a third-party repository.")
    )
    console.log(
      chalk.red(
        "Review the source before running unfamiliar examples. Use a test environment if you are unsure."
      )
    )
    console.log()
  }
  if (typeof chosenPort === "number") {
    const host = opts.envVars?.HOST || opts.envVars?.HOSTNAME || "localhost"
    const url = `http://${host}:${chosenPort}`
    console.log(chalk.cyan(`Open: ${url}`))
    if (host === "0.0.0.0") {
      console.log(chalk.dim(`Hint: try http://localhost:${chosenPort} in your browser`))
    }
    console.log()
  }
  const child = await runScript(
    cwd,
    pm as import("./get-pkg-manager.js").PackageManager,
    script,
    chosenPort,
    opts.envVars
  )
  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`script ${script} exited with code ${code}`))
    )
    child.on("error", reject)
  })
}
