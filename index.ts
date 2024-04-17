#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */
import chalk from "chalk";
import * as Commander from "commander";
import fs from "fs";
import path from "path";
import prompts from "prompts";
import checkForUpdate from "update-check";
import { fileURLToPath } from "url";
import { createApp, DownloadError } from "./create-app.js";
import { getPkgManager } from "./helpers/get-pkg-manager.js";
import { validateNpmName } from "./helpers/validate-pkg.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

let projectPath: string = "";

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments("<project-directory>")
  .usage(`${chalk.green("<project-directory>")} [options]`)
  .action((name) => {
    projectPath = name;
  })
  .option(
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
  .parse(process.argv);

async function run(): Promise<void> {
  if (typeof projectPath === "string") {
    projectPath = projectPath.trim();
  }

  if (!projectPath) {
    const res = await prompts({
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: "my-app",
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)));
        if (validation.valid) {
          return true;
        }
        return "Invalid project name: " + validation.problems![0];
      },
    });

    if (typeof res.path === "string") {
      projectPath = res.path.trim();
    }
  }

  if (!projectPath) {
    console.log();
    console.log("Please specify the project directory:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`
    );
    console.log();
    console.log("For example:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("my-trpc-app")}`
    );
    console.log();
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const { valid, problems } = validateNpmName(projectName);
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    );

    problems!.forEach((p) => console.error(`    ${chalk.red.bold("*")} ${p}`));
    process.exit(1);
  }

  if (program.getOptionValue("example") === true) {
    console.error(
      "Please provide an example name or url, otherwise remove the example option."
    );
    process.exit(1);
  }

  const packageManager = !!program.getOptionValue("useNpm")
    ? "npm"
    : !!program.getOptionValue("usePnpm")
    ? "pnpm"
    : getPkgManager();

  const example =
    typeof program.getOptionValue("example") === "string" &&
    (program.getOptionValue("example") ?? "")?.toString().trim();

  try {
    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
      example: example && example !== "default" ? example : undefined,
      examplePath: program.getOptionValue("examplePath"),
    });
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason;
    }

    const res = await prompts({
      type: "confirm",
      name: "builtin",
      message:
        `Could not download "${example}" because of a connectivity issue between your machine and GitHub.\n` +
        `Do you want to use the default template instead?`,
      initial: true,
    });
    if (!res.builtin) {
      throw reason;
    }

    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
    });
  }
}

const update = checkForUpdate(packageJson).catch(() => null);

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update;
    if (res?.latest) {
      const pkgManager = getPkgManager();

      console.log();
      console.log(
        chalk.yellow.bold("A new version of `create-trpc-appx` is available!")
      );
      console.log(
        "You can update by running: " +
          chalk.cyan(
            pkgManager === "yarn"
              ? "yarn global add create-trpc-appx"
              : `${pkgManager} install --global create-trpc-appx`
          )
      );
      console.log();
    }
    process.exit();
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log();
    console.log("Aborting installation.");
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`);
    } else {
      console.log(chalk.red("Unexpected error. Please report it as a bug:"));
      console.log(reason);
    }
    console.log();

    await notifyUpdate();

    process.exit(1);
  });
