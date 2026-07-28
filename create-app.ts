/* eslint-disable import/no-extraneous-dependencies */
import retry from "async-retry"
import chalk from "chalk"
import fs from "fs"
import path from "path"
import { copyTemplate } from "./helpers/copy-template.js"
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
import {
  DEFAULT_TEMPLATE,
  isTemplate,
  listTemplates,
  personalizePackageJson,
  templateDir,
} from "./helpers/templates.js"

export class DownloadError extends Error {}

/** Flatten a generated app's declared deps for display, dev deps last. */
function templateDependencies(root: string): Array<[string, string]> {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
    return [
      ...Object.entries(pkg.dependencies ?? {}),
      ...Object.entries(pkg.devDependencies ?? {}),
    ] as Array<[string, string]>
  } catch {
    return []
  }
}

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

  /**
   * `--example <name>` may name a template bundled with this CLI. Those are
   * resolved locally and never hit the network. Anything else is looked up in
   * the official tRPC examples, or treated as a GitHub URL.
   */
  const template = !example || isTemplate(example) ? (example ?? DEFAULT_TEMPLATE) : null

  if (example && !template) {
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
          `2. You might not be connected to the internet or you are behind a proxy.\n`,
          `Bundled templates that always work offline: ${listTemplates()
            .map((t) => chalk.cyan(t))
            .join(", ")}`
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

  if (!template) {
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
        await retry(() => downloadAndExtractExample(root, example!), {
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
      fs.copyFileSync(path.join(templateDir(DEFAULT_TEMPLATE), "gitignore"), ignorePath)
    }

    console.log("Installing packages. This might take a couple of minutes.")
    console.log()

    await install(root, null, { packageManager, isOnline })
    console.log()
  } else {
    /**
     * Copy the bundled template files to the target directory.
     */
    await copyTemplate(templateDir(template), root)

    /**
     * The template's own package.json is the single source of truth for which
     * versions the generated app gets. Previously this function also passed a
     * hard-coded dependency list to `install()`, which silently overwrote the
     * template's declared versions with tRPC 10.
     */
    personalizePackageJson(root, appName)

    console.log(chalk.bold(`Using ${packageManager}.`))
    console.log()
    console.log(`Installing dependencies declared by the ${chalk.cyan(template)} template:`)
    for (const [name, range] of templateDependencies(root)) {
      console.log(`- ${chalk.cyan(`${name}@${range}`)}`)
    }
    console.log()

    await install(root, null, { packageManager, isOnline })
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
