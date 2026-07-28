// Smoke tests for the `run` subcommand against public repositories.
//
// These assert on the CLI's actual output, not just its exit code. The previous
// version only checked `code === 0`, which is why `--example-path` being
// silently discarded went unnoticed: the runner happily "prepared" the
// repository root instead of the requested subdirectory and still exited 0.
//
// Requires network access. Set GITHUB_TOKEN to avoid API rate limits.
import assert from "node:assert"
import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")

const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "cta-smoke-cache-"))
let failures = 0

function runCli(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["dist/index.js", "run", ...args], {
      cwd: projectRoot,
      env: { ...process.env, ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => {
      stdout += d
      process.stdout.write(d)
    })
    child.stderr.on("data", (d) => {
      stderr += d
      process.stderr.write(d)
    })
    child.on("close", (code) => resolve({ code, stdout, stderr }))
    child.on("error", reject)
  })
}

/** The line `--prepare-only` prints, with the directory it settled on. */
function preparedPath(stdout) {
  const match = stdout.match(/Prepared example at:\s*(.+)\s*$/m)
  return match ? match[1].trim() : null
}

async function check(name, fn) {
  try {
    await fn()
    console.log(`\n  ok   ${name}\n`)
  } catch (err) {
    failures++
    console.error(`\n  FAIL ${name}\n       ${err.message}\n`)
  }
}

// ---------------------------------------------------------------------------
// A subdirectory requested with --example-path must be the directory prepared,
// and it must really exist on disk with a package.json in it.
// ---------------------------------------------------------------------------
await check("--example-path selects the requested subdirectory", async () => {
  const subdir = "examples/minimal"
  const { code, stdout } = await runCli([
    "trpc/trpc#main",
    "--example-path",
    subdir,
    "--prepare-only",
    "--no-install",
    "--cache-dir",
    cacheDir,
  ])
  assert.strictEqual(code, 0, `exited ${code}`)

  const prepared = preparedPath(stdout)
  assert.ok(prepared, "CLI never printed a prepared path")
  assert.ok(
    prepared.endsWith(path.join(subdir)),
    `prepared "${prepared}", which does not end with "${subdir}" -- --example-path was ignored`
  )
  assert.ok(fs.existsSync(prepared), `prepared path does not exist: ${prepared}`)
  assert.ok(
    fs.existsSync(path.join(prepared, "package.json")),
    `no package.json in prepared path: ${prepared}`
  )
})

// ---------------------------------------------------------------------------
// A subdirectory that does not exist must fail loudly instead of quietly
// falling back to the repository root.
// ---------------------------------------------------------------------------
await check("a missing --example-path fails instead of preparing the repo root", async () => {
  const { code, stdout, stderr } = await runCli([
    "trpc/trpc#main",
    "--example-path",
    "examples/definitely-not-a-real-example",
    "--prepare-only",
    "--no-install",
    "--cache-dir",
    cacheDir,
  ])
  assert.notStrictEqual(code, 0, "a nonexistent subdirectory exited 0")
  assert.match(
    stdout + stderr,
    /definitely-not-a-real-example/,
    "the error did not name the missing path"
  )
  assert.strictEqual(
    preparedPath(stdout),
    null,
    "the CLI claimed to prepare an example that does not exist"
  )
})

// ---------------------------------------------------------------------------
// A whole-repository example, with no subdirectory.
// ---------------------------------------------------------------------------
await check("a whole repo prepares to a directory containing a package.json", async () => {
  const { code, stdout } = await runCli([
    "trpc/examples-next-prisma-starter#main",
    "--prepare-only",
    "--no-install",
    "--cache-dir",
    cacheDir,
  ])
  assert.strictEqual(code, 0, `exited ${code}`)
  const prepared = preparedPath(stdout)
  assert.ok(prepared, "CLI never printed a prepared path")
  assert.ok(
    fs.existsSync(path.join(prepared, "package.json")),
    `no package.json in prepared path: ${prepared}`
  )
})

// ---------------------------------------------------------------------------
// A repository that does not exist must fail, not silently succeed.
// ---------------------------------------------------------------------------
await check("a nonexistent repository fails", async () => {
  const { code } = await runCli([
    "trpc/this-repo-does-not-exist-cta-smoke#main",
    "--prepare-only",
    "--no-install",
    "--cache-dir",
    cacheDir,
  ])
  assert.notStrictEqual(code, 0, "a nonexistent repository exited 0")
})

fs.rmSync(cacheDir, { recursive: true, force: true })

if (failures > 0) {
  console.error(`Smoke tests failed: ${failures} case(s).`)
  process.exit(1)
}
console.log("Smoke tests completed.")
