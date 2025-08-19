/* eslint-disable import/no-extraneous-dependencies */
import retry from "async-retry"
import chalk from "chalk"
import cpy from "cpy"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
  downloadAndExtractExample,
  downloadAndExtractRepo,
  getRepoInfo,
  hasExample,
  hasRepo,
  RepoInfo,
} from "./helpers/examples.js"
import type { PackageManager } from "./helpers/get-pkg-manager.js"
import { tryGitInit } from "./helpers/git.js"
import { install } from "./helpers/install.js"
import { isFolderEmpty } from "./helpers/is-folder-empty.js"
import { getOnline } from "./helpers/is-online.js"
import { isWriteable } from "./helpers/is-writeable.js"
import { makeDir } from "./helpers/make-dir.js"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class DownloadError extends Error {}

export async function createApp({
  appPath,
  packageManager,
  example,
  examplePath,
}: {
  appPath: string
  packageManager: PackageManager
  example?: string
  examplePath?: string
}): Promise<void> {
  let repoInfo: RepoInfo | undefined
  const template = "default"

  if (example) {
    let repoUrl: URL | undefined

    try {
      repoUrl = new URL(example)
    } catch (error: any) {
      if (error.code !== "ERR_INVALID_URL") {
        console.error(error)
        process.exit(1)
      }
    }

    if (repoUrl) {
      if (repoUrl.origin !== "https://github.com") {
        console.error(
          `Invalid URL: ${chalk.red(
            `"${example}"`
          )}. Only GitHub repositories are supported. Please use a GitHub URL and try again.`
        )
        process.exit(1)
      }

      repoInfo = await getRepoInfo(repoUrl, examplePath)

      if (!repoInfo) {
        console.error(
          `Found invalid GitHub URL: ${chalk.red(
            `"${example}"`
          )}. Please fix the URL and try again.`
        )
        process.exit(1)
      }

      const found = await hasRepo(repoInfo)

      if (!found) {
        console.error(
          `Could not locate the repository for ${chalk.red(
            `"${example}"`
          )}. Please check that the repository exists and try again.`
        )
        process.exit(1)
      }
    } else if (example !== "__internal-testing-retry") {
      const found = await hasExample(example)

      if (!found) {
        console.error(
          `Could not locate an example named ${chalk.red(
            `"${example}"`
          )}. It could be due to the following:\n`,
          `1. Your spelling of example ${chalk.red(`"${example}"`)} might be incorrect.\n`,
          `2. You might not be connected to the internet or you are behind a proxy.`
        )
        process.exit(1)
      }
    }
  }

  const root = path.resolve(appPath)

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again."
    )
    console.error("It is likely you do not have write permissions for this folder.")
    process.exit(1)
  }

  const appName = path.basename(root)

  await makeDir(root)
  if (!isFolderEmpty(root, appName)) {
    process.exit(1)
  }

  const useYarn = packageManager === "yarn"
  const isOnline = !useYarn || (await getOnline())
  const originalDirectory = process.cwd()

  console.log(`Creating a new tRPC app in ${chalk.green(root)}.`)
  console.log()

  process.chdir(root)

  if (example) {
    /**
     * If an example repository is provided, clone it.
     */
    try {
      if (repoInfo) {
        const repoInfo2 = repoInfo
        console.log(`Downloading files from repo ${chalk.cyan(example)}. This might take a moment.`)
        console.log()
        await retry(() => downloadAndExtractRepo(root, repoInfo2), {
          retries: 3,
        } as any)
      } else {
        console.log(
          `Downloading files for example ${chalk.cyan(example)}. This might take a moment.`
        )
        console.log()
        await retry(() => downloadAndExtractExample(root, example), {
          retries: 3,
        } as any)
      }
    } catch (reason) {
      function isErrorLike(err: unknown): err is { message: string } {
        return (
          typeof err === "object" &&
          err !== null &&
          typeof (err as { message?: unknown }).message === "string"
        )
      }
      throw new DownloadError(isErrorLike(reason) ? reason.message : reason + "")
    }
    // Copy our default `.gitignore` if the application did not provide one
    const ignorePath = path.join(root, ".gitignore")
    if (!fs.existsSync(ignorePath)) {
      fs.copyFileSync(path.join(__dirname, "templates", template, "gitignore"), ignorePath)
    }

    console.log("Installing packages. This might take a couple of minutes.")
    console.log()

    await install(root, null, { packageManager, isOnline })
    console.log()
  } else {
    const templatePath = path.join(__dirname, "templates", template)
    /**
     * Copy the template files to the target directory.
     */
    await cpy("**", root, {
      cwd: templatePath,
      parents: true,
      rename: (name: string) => {
        switch (name) {
          case "gitignore":
          case "eslintrc.json": {
            return ".".concat(name)
          }
          case "README-template.md": {
            return "README.md"
          }
          default: {
            return name
          }
        }
      },
    })

    /**
     * Otherwise, if an example repository is not provided for cloning, proceed
     * by installing from a template.
     */
    console.log(chalk.bold(`Using ${packageManager}.`))
    /**
     * These flags will be passed to `install()`.
     */
    const installFlags = { packageManager, isOnline }
    /**
     * Default dependencies.
     */
    const dependencies = [
      "@trpc/client@^10.45.2",
      "@trpc/react-query@^10.45.2",
      "@trpc/server@^10.45.2",
      "express@^4.17.1",
      "zod@^3.0.0",
    ]
    /**
     * Default devDependencies.
     */
    const devDependencies = [
      "@types/express@^4.17.17",
      "@types/node@^20.10.0",
      "@types/react@^18.2.33",
      "esbuild@^0.17.10",
      "eslint@^8.40.0",
      "npm-run-all@^4.1.5",
      "start-server-and-test@^1.12.0",
      "tsx@^4.0.0",
      "typescript@^5.4.0",
      "wait-port@^1.0.1",
    ]
    /**
     * TypeScript projects will have type definitions and other devDependencies.
     */
    // devDependencies.push("typescript", "@types/node");
    /**
     * Install package.json dependencies if they exist.
     */
    if (dependencies.length) {
      console.log()
      console.log("Installing dependencies:")
      for (const dependency of dependencies) {
        console.log(`- ${chalk.cyan(dependency)}`)
      }
      console.log()

      await install(root, dependencies, installFlags)
    }
    /**
     * Install package.json devDependencies if they exist.
     */
    if (devDependencies.length) {
      console.log()
      console.log("Installing devDependencies:")
      for (const devDependency of devDependencies) {
        console.log(`- ${chalk.cyan(devDependency)}`)
      }
      console.log()

      const devInstallFlags = { devDependencies: true, ...installFlags }
      await install(root, devDependencies, devInstallFlags)
    }
    console.log()
  }

  if (tryGitInit(root)) {
    console.log("Initialized a git repository.")
    console.log()
  }

  let cdpath: string
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName
  } else {
    cdpath = appPath
  }

  console.log(`${chalk.green("Success!")} Created ${appName} at ${appPath}`)
  console.log()
  console.log("We suggest that you begin by typing:")
  console.log()
  console.log(chalk.cyan("  cd"), cdpath)
  console.log()
}
