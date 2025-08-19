/* eslint-disable import/no-extraneous-dependencies */
import chalk from "chalk"
import fs from "fs"
import path from "path"
import { detectPackageManager } from "./run.js"

export async function runInfo(dir = "."): Promise<void> {
  const cwd = path.resolve(dir)
  const pkgPath = path.join(cwd, "package.json")
  if (!fs.existsSync(pkgPath)) {
    console.log(chalk.yellow(`No package.json found in ${cwd}`))
    return
  }
  const pkgRaw = fs.readFileSync(pkgPath, "utf8")
  const pkg = JSON.parse(pkgRaw)

  const has = (f: string) => fs.existsSync(path.join(cwd, f))
  const locks = [
    has("package-lock.json") && "package-lock.json",
    has("pnpm-lock.yaml") && "pnpm-lock.yaml",
    has("yarn.lock") && "yarn.lock",
  ].filter(Boolean) as string[]

  const pm = detectPackageManager(cwd)
  const scripts = pkg.scripts ? Object.keys(pkg.scripts) : []
  const enginesNode = pkg.engines?.node
  const pkgManagerField = pkg.packageManager
  const isPrivate = !!pkg.private
  const workspaces = pkg.workspaces ?? null

  console.log(chalk.bold("Project info"))
  console.log(`${chalk.cyan("path")}: ${cwd}`)
  console.log(`${chalk.cyan("name")}: ${pkg.name ?? "-"}`)
  console.log(`${chalk.cyan("version")}: ${pkg.version ?? "-"}`)
  console.log(`${chalk.cyan("detected pm")}: ${pm}`)
  console.log(`${chalk.cyan("packageManager field")}: ${pkgManagerField ?? "-"}`)
  console.log(`${chalk.cyan("lockfiles")}: ${locks.length ? locks.join(", ") : "-"}`)
  console.log(`${chalk.cyan("workspaces")}: ${workspaces ? JSON.stringify(workspaces) : "-"}`)
  console.log(`${chalk.cyan("private")}: ${isPrivate}`)
  console.log(`${chalk.cyan("engines.node")}: ${enginesNode ?? "-"}`)
  console.log(`${chalk.cyan("scripts")}: ${scripts.length ? scripts.join(", ") : "-"}`)
}
