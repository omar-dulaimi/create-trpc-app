#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import chalk from "chalk"
import * as Commander from "commander"
import fs from "fs"
import os from "os"
import path from "path"
import prompts from "prompts"
import checkForUpdate from "update-check"
import { fileURLToPath } from "url"
import { createApp, DownloadError } from "./create-app.js"
import { runDoctor } from "./helpers/doctor.js"
import { getPkgManager } from "./helpers/get-pkg-manager.js"
import { runInfo } from "./helpers/info.js"
import { runExample } from "./helpers/run.js"
import { validateNpmName } from "./helpers/validate-pkg.js"

function readUserConfig(): any {
  try {
    const configPath = path.join(os.homedir(), ".config", "create-trpc-app", "config.json")
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"))
    }
  } catch {}
  return {}
}

function getDefaultCacheDir() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
  return path.join(base, "create-trpc-appx")
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Resolve package.json relative to project root when bundled to dist
// dist/index.js sits in dist/, root package.json is one level up at build-time
const packageJsonPath = fs.existsSync(path.resolve(__dirname, "./package.json"))
  ? path.resolve(__dirname, "./package.json")
  : path.resolve(__dirname, "../package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

let projectPath: string = ""
let invokedSubcommand = false
let longRunningSubcommand = false

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  // Accept a project directory as an operand for the root command (optional to allow interactive prompt)
  .argument("[project-directory]")
  .usage(`${chalk.green("<project-directory>")} [options]`)
  .option("--yes", "Skip prompts and use sensible defaults (non-interactive mode)")
  .option("--verbose", "Enable verbose logging for troubleshooting")

  .command("doctor")
  .description("Diagnose local environment: Node, package managers, Corepack, network/proxy, Git")
  .action(async () => {
    invokedSubcommand = true
    await runDoctor()
  })
  .parent!.command("info [dir]")
  .description("Print detected project info: package manager, scripts, workspaces, engines")
  .action(async (dir: string | undefined) => {
    invokedSubcommand = true
    await runInfo(dir)
  })
  .parent!.command("run <github-url>")
  .description(
    "Fetch, prepare, and run a tRPC example from a GitHub URL (supports subdirectories via --example-path)"
  )
  .option("--example-path <path>", "Subdirectory within the repo to use as the example root")
  .option("--script <name>", "Script to run (default: dev, fallback: start)")
  .option("--port <number>", "Set PORT environment variable", (v) => parseInt(v, 10))
  .option("--auto-port", "Automatically pick a free port starting at --port or 3000")
  .option("--no-install", "Skip dependency installation")
  .option("--offline", "Run in offline mode (requires cached example)")
  .option("--no-cache", "Disable cache and force re-download")
  .option("--cache-dir <path>", "Directory to use for cache (default: XDG cache dir)")
  .option(
    "--prepare-only",
    "Download & extract (and optionally install) without running dev/start script"
  )
  .option("--prebuild <mode>", "Prebuild mode: auto|always|never (default: auto)")
  .option(
    "--env <KEY=VALUE>",
    "Environment variable to pass to the example (repeatable)",
    (val: string, prev: string[] | undefined) => (prev ? [...prev, val] : [val])
  )
  .option("--env-file <path>", "Path to a .env-like file containing KEY=VALUE lines")
  .action(async (githubUrl: string, opts: any) => {
    if (opts.verbose) {
      process.env.CTA_VERBOSE = "1"
    }
    invokedSubcommand = true
    longRunningSubcommand = true
    const parseKv = (s: string): [string, string] | null => {
      const i = s.indexOf("=")
      if (i <= 0) return null
      const k = s.slice(0, i).trim()
      const v = s.slice(i + 1)
      if (!k) return null
      return [k, v]
    }
    const envPairs: string[] = Array.isArray(opts.env)
      ? (opts.env as string[])
      : opts.env
        ? [opts.env]
        : []
    const envVars: Record<string, string> = {}
    for (const p of envPairs) {
      const kv = parseKv(String(p))
      if (kv) envVars[kv[0]] = kv[1]
    }
    if (opts.envFile) {
      try {
        const content = fs.readFileSync(path.resolve(String(opts.envFile)), "utf8")
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith("#")) continue
          const kv = parseKv(trimmed)
          if (kv && envVars[kv[0]] === undefined) envVars[kv[0]] = kv[1]
        }
      } catch (e) {
        console.log(chalk.yellow(`Could not read env file: ${opts.envFile}`))
      }
    }
    if (process.env.CTA_VERBOSE === "1" || process.env.DEBUG?.startsWith("cta:")) {
      console.log(chalk.gray("[DEBUG] Running example with options:"), opts)
    }
    // Detect package manager from CLI flags for run command
    let pm = "npm"
    if (opts.usePnpm) pm = "pnpm"
    else if (opts.useYarn) pm = "yarn"
    else if (opts.useNpm) pm = "npm"
    await runExample({
      githubUrl,
      examplePath: opts.examplePath,
      script: opts.script,
      port: opts.port,
      install: opts.install !== false,
      offline: !!opts.offline,
      cache: opts.cache !== false,
      cacheDir: opts.cacheDir,
      envVars,
      prepareOnly: !!opts.prepareOnly,
      autoPort: !!opts.autoPort,
      prebuildMode: ((): "auto" | "always" | "never" => {
        const v = String(opts.prebuild || "auto").toLowerCase()
        return v === "always" || v === "never" ? (v as any) : "auto"
      })(),
      packageManager: pm,
    })
  })
  .parent!.option(
    "--use-npm",
    `

  Explicitly tell the CLI to bootstrap the app using npm
`,
    true
  )
  .option(
    "--use-pnpm",
    `

  Explicitly tell the CLI to bootstrap the app using pnpm
`
  )
  .option(
    "-e, --example [name]|[github-url]",
    `

  An example to bootstrap the app with. You can use an example name
  from the official tRPC repo or a GitHub URL. The URL can use
  any branch and/or subdirectory
`
  )
  .option(
    "--example-path <path-to-example>",
    `

  In a rare case, your GitHub URL might contain a branch name with
  a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar).
  In this case, you must specify the path to the example separately:
  --example-path foo/bar
`
  )
  .allowUnknownOption()

// Root action: triggered when no subcommand is invoked. Captures the optional
// project directory operand so running `create-trpc-appx my-app` works.
program.action((dir: string | undefined) => {
  if (typeof dir === "string") {
    projectPath = dir
  }
})

async function run(): Promise<void> {
  if (typeof projectPath === "string") {
    projectPath = projectPath.trim()
  }

  if (!projectPath) {
    const res = await prompts({
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: "my-app",
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)))
        if (validation.valid) {
          return true
        }
        return "Invalid project name: " + validation.problems![0]
      },
    })

    if (typeof res.path === "string") {
      projectPath = res.path.trim()
    }
  }

  if (!projectPath) {
    console.log()
    console.log("Please specify the project directory:")
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`)
    console.log()
    console.log("For example:")
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green("my-trpc-app")}`)
    console.log()
    console.log(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`)
    process.exit(1)
  }

  const resolvedProjectPath = path.resolve(projectPath)
  const projectName = path.basename(resolvedProjectPath)

  const { valid, problems } = validateNpmName(projectName)
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    )

    problems!.forEach((p) => console.error(`    ${chalk.red.bold("*")} ${p}`))
    process.exit(1)
  }

  if (program.getOptionValue("example") === true) {
    console.error("Please provide an example name or url, otherwise remove the example option.")
    process.exit(1)
  }

  const userConfig = readUserConfig()
  const packageManager = !!program.getOptionValue("useNpm")
    ? "npm"
    : !!program.getOptionValue("usePnpm")
      ? "pnpm"
      : userConfig.packageManager || getPkgManager()

  const example =
    typeof program.getOptionValue("example") === "string" &&
    (program.getOptionValue("example") ?? "")?.toString().trim()

  try {
    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
      example: example && example !== "default" ? example : undefined,
      examplePath: program.getOptionValue("examplePath"),
    })
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason
    }

    const res = await prompts({
      type: "confirm",
      name: "builtin",
      message:
        `Could not download "${example}" because of a connectivity issue between your machine and GitHub.\n` +
        `Do you want to use the default template instead?`,
      initial: true,
    })
    if (!res.builtin) {
      throw reason
    }

    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
    })
  }
}

type UpdateCheckFn = (pkg: any, options?: any) => Promise<{ latest?: string } | null>
const update = (checkForUpdate as unknown as UpdateCheckFn)(packageJson).catch(() => null)

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update
    if (res?.latest) {
      const pkgManager = getPkgManager()

      console.log()
      console.log(chalk.yellow.bold("A new version of `create-trpc-appx` is available!"))
      console.log(
        "You can update by running: " +
          chalk.cyan(
            pkgManager === "yarn"
              ? "yarn global add create-trpc-appx"
              : `${pkgManager} install --global create-trpc-appx`
          )
      )
      console.log()
    }
    process.exit()
  } catch {
    // ignore error
  }
}

// Parse CLI and run appropriate command. If no subcommand invoked, run scaffolding flow.
;(async () => {
  await program.parseAsync(process.argv)
  if (invokedSubcommand) {
    if (!longRunningSubcommand) {
      await notifyUpdate()
    }
    return
  }
  run()
    .then(notifyUpdate)
    .catch(async (reason) => {
      console.log()
      console.log("Aborting installation.")
      if ((reason as any).command) {
        console.log(`  ${chalk.cyan((reason as any).command)} has failed.`)
      } else {
        console.log(chalk.red("Unexpected error. Please report it as a bug:"))
        console.log(reason)
      }
      console.log()

      await notifyUpdate()

      process.exit(1)
    })
})()
