/* eslint-disable import/no-extraneous-dependencies */
import chalk from "chalk"
import { execSync } from "child_process"
import got from "got"

function check(cmd: string): { ok: boolean; version?: string; error?: string } {
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
      .toString()
      .trim()
    const version = out.split("\n")[0]
    return { ok: true, version }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}

async function checkNetwork(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await got.head("https://api.github.com", { timeout: { request: 5000 } })
    return { ok: res.statusCode === 200 }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}

export async function runDoctor(): Promise<void> {
  console.log(chalk.bold("Environment diagnostics"))

  // Node
  const nodeVersion = process.version
  console.log(`${chalk.cyan("Node")}: ${nodeVersion}`)

  // Corepack
  const corepack = check("corepack --version")
  console.log(
    `${chalk.cyan("Corepack")}: ${corepack.ok ? corepack.version : chalk.yellow("missing")}`
  )

  // Package managers
  const npm = check("npm --version")
  const pnpm = check("pnpm --version")
  const yarn = check("yarn --version")
  console.log(
    `${chalk.cyan("npm/pnpm/yarn")}: ` +
      `npm=${npm.ok ? npm.version : "-"}, ` +
      `pnpm=${pnpm.ok ? pnpm.version : "-"}, ` +
      `yarn=${yarn.ok ? yarn.version : "-"}`
  )

  // Git
  const git = check("git --version")
  console.log(`${chalk.cyan("git")}: ${git.ok ? git.version : chalk.yellow("missing")}`)

  // Proxy env
  const proxyVars = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"] as const
  const proxyInfo = proxyVars.map((k) => `${k}=${process.env[k] ? "set" : "unset"}`).join(", ")
  console.log(`${chalk.cyan("proxy")}: ${proxyInfo}`)

  // Network
  const net = await checkNetwork()
  console.log(
    `${chalk.cyan("network to api.github.com")}: ${net.ok ? "ok" : chalk.red("unreachable")}`
  )
  if (!net.ok && net.error) {
    console.log(chalk.yellow(`hint: check proxy settings or retry later. ${net.error}`))
  }

  // Summary & guidance
  const issues = [!corepack.ok, !npm.ok && !pnpm.ok && !yarn.ok, !git.ok, !net.ok].filter(
    Boolean
  ).length
  if (issues === 0) {
    console.log()
    console.log(chalk.green("Doctor found no critical issues."))
  } else {
    console.log()
    console.log(
      chalk.yellow(
        `Doctor found ${issues} potential issue(s). Fix the above items before running examples for best results.`
      )
    )
  }
}
