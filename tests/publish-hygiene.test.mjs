// Guards what the release pipeline ships, and what it must refuse to ship.
//
// Everything here is checked against a real tarball or a real `npm publish`
// attempt, never by reading a config file. Three defects it locks down, all of
// which were live and none of which any other check noticed:
//
//  1. package/package.json shipped the repository's development surface: 11
//     `scripts` and 26 `devDependencies`, advertised to every consumer.
//  2. `scripts.prepare: "husky"` in that manifest ran husky inside package/
//     during `npm pack` and `npm publish`, where there is no .git. Husky wrote
//     ".git can't be found" to stdout with no trailing newline, so the tarball
//     filename npm prints next ran straight into it:
//     `.git can't be foundcreate-trpc-appx-1.0.2.tgz`.
//  3. The repository root was publishable. `npm publish` there succeeded past
//     every local check and would have shipped 115 files as create-trpc-appx,
//     including .github/workflows/*.yml, .husky/pre-push, .releaserc.json,
//     .vscode/tasks.json and the TypeScript sources.
//
// Usage: node tests/publish-hygiene.test.mjs
import assert from "node:assert"
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { x as extractTar } from "tar"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

/**
 * A registry that cannot answer. Port 1 on the loopback address is closed, and
 * 127.0.0.1 is spelled out rather than "localhost" because a CI runner can
 * resolve that to ::1 and change which socket npm fails on.
 */
const DEAD_REGISTRY = "http://127.0.0.1:1/"

function sh(cmd, args, opts = {}) {
  const { capture, ...rest } = opts
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      maxBuffer: 64 * 1024 * 1024,
      ...rest,
    })
  } catch (err) {
    if (capture) {
      if (err.stdout) process.stdout.write(err.stdout)
      if (err.stderr) process.stderr.write(err.stderr)
    }
    throw err
  }
}

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "cta-publish-hygiene-"))
console.log(`work dir: ${workDir}`)

try {
  // ---------------------------------------------------------------------------
  // 1. Assemble and pack the publishable directory, exactly as the release
  //    workflow and `package:publish` do.
  // ---------------------------------------------------------------------------
  console.log("\n== assembling the publishable package ==")
  sh("bash", ["package.sh"], { cwd: repoRoot })

  const packDir = path.join(repoRoot, "package")
  const packOut = sh("npm", ["pack", "--pack-destination", workDir, "--json"], {
    cwd: packDir,
    capture: true,
  })

  // Defect 2. `--json` means the whole of stdout is the result, so parsing all
  // of it (rather than slicing from the first "[") is the assertion: anything a
  // lifecycle script prints lands here and breaks the parse. This is the check
  // that would have caught `prepare: husky` running in a directory with no .git.
  let packResult
  try {
    packResult = JSON.parse(packOut)
  } catch {
    assert.fail(
      "`npm pack --json` inside package/ wrote something other than JSON to stdout, so a " +
        "lifecycle script in the published manifest is printing over npm's output. " +
        `Got: ${JSON.stringify(packOut.slice(0, 200))}`
    )
  }

  const tarball = path.join(workDir, packResult[0].filename)
  assert.ok(fs.existsSync(tarball), `npm pack produced no tarball: ${tarball}`)
  console.log(`packed: ${tarball}`)

  // ---------------------------------------------------------------------------
  // 2. Read the manifest back out of the tarball. Not out of package/: the
  //    tarball is what reaches the registry.
  // ---------------------------------------------------------------------------
  console.log("\n== inspecting the manifest inside the tarball ==")
  const extractDir = path.join(workDir, "extracted")
  fs.mkdirSync(extractDir)
  await extractTar({ file: tarball, cwd: extractDir })

  const shipped = JSON.parse(
    fs.readFileSync(path.join(extractDir, "package", "package.json"), "utf8")
  )

  // Defect 1. Neither belongs in a published CLI: `scripts` are the
  // repository's own build and release commands, and `devDependencies` are
  // metadata every consumer and every scanner would then see.
  assert.ok(
    !("scripts" in shipped),
    `the published manifest still carries scripts: ${JSON.stringify(Object.keys(shipped.scripts ?? {}))}`
  )
  assert.ok(
    !("devDependencies" in shipped),
    `the published manifest still carries ${Object.keys(shipped.devDependencies ?? {}).length} devDependencies`
  )
  // `private` must be gone rather than set to false, because the repository
  // root now sets it to true and package.sh copies that manifest verbatim.
  assert.ok(
    !("private" in shipped),
    `the published manifest still carries "private": ${JSON.stringify(shipped.private)}`
  )

  // Guard the other direction: stripping must not take anything load-bearing.
  for (const field of ["name", "version", "bin", "dependencies", "engines", "license"]) {
    assert.ok(field in shipped, `the published manifest lost "${field}"`)
  }
  console.log(
    `manifest fields: ${Object.keys(shipped).join(", ")}\n` +
      `runtime dependencies: ${Object.keys(shipped.dependencies).length}`
  )

  // Nothing but the built output and the three metadata files may ship.
  const entries = new Set(
    execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .map((e) => e.replace(/^package\//, "").split("/")[0])
  )
  assert.deepStrictEqual(
    [...entries].sort(),
    ["LICENSE", "README.md", "dist", "package.json"],
    "the tarball contains something other than dist/ and the three metadata files"
  )

  // ---------------------------------------------------------------------------
  // 3. Defect 3: the repository root must not be publishable.
  //
  //    `npm publish --dry-run` proves nothing here. npm only reaches the
  //    `private` guard inside libnpmpublish, and a dry run never calls it, so a
  //    dry run at the root exits 0 whether or not the guard is in place.
  //    This runs a real publish against a dead loopback registry with throwaway
  //    credentials instead, and distinguishes the two outcomes by error code:
  //
  //      EPRIVATE     npm refused before touching any registry  -> guarded
  //      ECONNREFUSED npm packed the root and tried to upload it -> publishable
  // ---------------------------------------------------------------------------
  console.log("\n== the repository root must refuse to publish ==")
  const userconfig = path.join(workDir, "npmrc")
  fs.writeFileSync(
    userconfig,
    [
      `registry=${DEAD_REGISTRY}`,
      // A throwaway credential for the dead registry. Without one npm stops at
      // ENEEDAUTH before it reaches the guard, and the check would pass for the
      // wrong reason. --userconfig means the real ~/.npmrc is never read.
      "//127.0.0.1:1/:_authToken=publish-guard-probe",
      // So the unguarded case fails immediately instead of retrying for ~2min.
      "fetch-retries=0",
      "",
    ].join("\n")
  )

  const env = { ...process.env }
  // Keep npm 11's OIDC step a no-op: with these set it would call the registry
  // before the `private` guard and fail on the network instead.
  delete env.ACTIONS_ID_TOKEN_REQUEST_URL
  delete env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  delete env.NPM_ID_TOKEN

  const attempt = spawnSync(
    "npm",
    [
      "publish",
      "--ignore-scripts",
      // Skips the "does this version exist" lookup, which is a network call.
      "--force",
      "--userconfig",
      userconfig,
      // A command-line flag outranks every config file and environment
      // variable, so this cannot be pointed at a real registry by accident.
      "--registry",
      DEAD_REGISTRY,
    ],
    { cwd: repoRoot, encoding: "utf8", env, maxBuffer: 64 * 1024 * 1024 }
  )

  const stderr = attempt.stderr ?? ""
  assert.notStrictEqual(
    attempt.status,
    0,
    "`npm publish` at the repository root succeeded. The root must be private so that " +
      "publishing the repository itself, sources and CI configuration included, cannot happen."
  )
  assert.ok(
    !/ECONNREFUSED/.test(stderr),
    "`npm publish` at the repository root got as far as contacting a registry, which means " +
      "npm considered the root publishable. Only a failed connection stopped it. Set " +
      '"private": true in the root package.json.'
  )
  assert.match(
    stderr,
    /EPRIVATE/,
    "`npm publish` at the repository root failed, but not because the root is private:\n" +
      stderr.slice(-800)
  )
  console.log("npm refused with EPRIVATE, before contacting any registry")

  console.log("\nAll publish hygiene checks passed.")
} finally {
  fs.rmSync(workDir, { recursive: true, force: true })
}
