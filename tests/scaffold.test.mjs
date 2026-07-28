// End-to-end verification against the PACKAGED artifact.
//
// Builds the publishable package with package.sh, `npm pack`s it, installs the
// tarball into an empty directory, then runs the README's headline command from
// that install and checks the generated project.
//
// This exists because the templates shipped broken for years while `npm test`
// stayed green: nothing ever ran the published package.
//
// Usage: node tests/scaffold.test.mjs [template ...]
//        node tests/scaffold.test.mjs            # all bundled templates
//
// Negative control: CTA_BREAK_PACKAGE=drop-templates|trpc-v10 damages the
// package before it is packed, and the run must then FAIL. See BREAK_MODES.
import assert from "node:assert"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

const ALL_TEMPLATES = ["default", "vite-react", "nextjs-app"]
const requested = process.argv.slice(2)
const templates = requested.length > 0 ? requested : ALL_TEMPLATES

for (const t of templates) {
  assert.ok(ALL_TEMPLATES.includes(t), `unknown template: ${t}`)
}

/**
 * Which scripts prove a scaffolded project actually works, per template.
 * `default` runs the client against its own server and exits; the two web
 * templates build for production.
 */
const VERIFY = {
  default: ["type-check", "test-dev"],
  "vite-react": ["type-check", "build"],
  "nextjs-app": ["build"],
}

/** Every template must end up on this tRPC major. */
const TRPC_MAJOR = 11

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
    // With captured output a failure would otherwise print nothing useful.
    if (capture) {
      if (err.stdout) process.stdout.write(err.stdout)
      if (err.stderr) process.stderr.write(err.stderr)
    }
    throw err
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"))
}

function majorOf(range) {
  return Number(
    String(range)
      .replace(/^[^0-9]*/, "")
      .split(".")[0]
  )
}

/**
 * Negative control. Each mode damages the assembled package in a way that
 * reproduces a defect this file is supposed to catch. CI runs the script once
 * per mode and requires a NON-ZERO exit: if a deliberately broken package still
 * passes, the checks below are inert and a green scaffold job proves nothing.
 */
const BREAK_MODES = {
  // A packaging rule that omits required runtime assets. This is the defect
  // class the whole file exists for: the tarball looks fine, installs fine, and
  // then has nothing to scaffold from.
  "drop-templates": (packDir) => {
    const dir = path.join(packDir, "dist", "templates")
    assert.ok(fs.existsSync(dir), `nothing to break: ${dir} does not exist`)
    fs.rmSync(dir, { recursive: true, force: true })
  },
  // A manifest pinned to the end-of-life tRPC major, which is what actually
  // reached users. Proves the declared/installed version assertions are live.
  "trpc-v10": (packDir) => {
    const p = path.join(packDir, "dist", "templates", "default", "package.json")
    const pkg = readJson(p)
    let touched = 0
    for (const field of ["dependencies", "devDependencies"]) {
      for (const dep of Object.keys(pkg[field] ?? {})) {
        if (dep.startsWith("@trpc/")) {
          pkg[field][dep] = "^10.45.2"
          touched++
        }
      }
    }
    assert.ok(touched > 0, `nothing to break: no @trpc/* dependency in ${p}`)
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2))
  },
}

/**
 * Applied after package.sh and before `npm pack`, so the damage is carried by
 * the tarball that the rest of this script installs and runs.
 */
function applyNegativeControl(packDir) {
  const mode = process.env.CTA_BREAK_PACKAGE
  if (!mode) return
  const breaker = BREAK_MODES[mode]
  assert.ok(
    breaker,
    `unknown CTA_BREAK_PACKAGE mode "${mode}", expected one of: ${Object.keys(BREAK_MODES).join(", ")}`
  )
  console.log(`\n!! NEGATIVE CONTROL: damaging the packaged artifact ("${mode}")`)
  console.log("!! This run is REQUIRED to fail. If it passes, the checks below test nothing.")
  breaker(packDir)
}

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "cta-scaffold-"))
console.log(`work dir: ${workDir}`)

try {
  // -------------------------------------------------------------------------
  // 1. Build the publishable package exactly the way `package:publish` does,
  //    and pack it.
  // -------------------------------------------------------------------------
  console.log("\n== packing the publishable package ==")
  sh("bash", ["package.sh"], { cwd: repoRoot })

  const packDir = path.join(repoRoot, "package")
  applyNegativeControl(packDir)

  // --json, so the filename comes back as data rather than as one line among
  // npm's warnings. Parsing the whole stream is deliberate: package.sh strips
  // `scripts` from the published manifest, so nothing runs here that could
  // print over npm's output. This used to slice from the first "[" to step over
  // husky's ".git can't be found", which `prepare` emitted from inside
  // package/. See tests/publish-hygiene.test.mjs.
  const packOut = sh("npm", ["pack", "--pack-destination", workDir, "--json"], {
    cwd: packDir,
    capture: true,
  })
  const packed = JSON.parse(packOut)[0].filename
  const tarball = path.join(workDir, packed)
  assert.ok(fs.existsSync(tarball), `npm pack produced no tarball: ${tarball}`)
  console.log(`packed: ${tarball}`)

  // -------------------------------------------------------------------------
  // 2. Install the tarball into an empty directory. Nothing from the repo's own
  //    node_modules is on the path from here on.
  // -------------------------------------------------------------------------
  console.log("\n== installing the tarball into an empty directory ==")
  const installDir = path.join(workDir, "install")
  fs.mkdirSync(installDir)
  fs.writeFileSync(
    path.join(installDir, "package.json"),
    JSON.stringify({ name: "cta-consumer", private: true, version: "1.0.0" }, null, 2)
  )
  sh("npm", ["install", "--no-audit", "--no-fund", tarball], { cwd: installDir })

  const cli = path.join(installDir, "node_modules", ".bin", "create-trpc-appx")
  assert.ok(fs.existsSync(cli), `installed package exposes no bin at ${cli}`)

  const version = sh(cli, ["--version"], { capture: true }).trim()
  console.log(`installed CLI reports version ${version}`)
  assert.match(version, /^\d+\.\d+\.\d+/)

  // The published package must not carry a dependency that is only needed to
  // build it, and must not ship a vulnerable extractor.
  const installedPkg = readJson(
    path.join(installDir, "node_modules", "create-trpc-appx", "package.json")
  )
  assert.ok(
    !installedPkg.dependencies?.typescript,
    "typescript is a build tool and must not be a production dependency"
  )
  assert.ok(
    !installedPkg.dependencies?.["@commander-js/extra-typings"],
    "@commander-js/extra-typings is never imported and must not be a dependency"
  )
  const tarVersion = readJson(path.join(installDir, "node_modules", "tar", "package.json")).version
  const [tMaj, tMin, tPatch] = tarVersion.split(".").map(Number)
  assert.ok(
    tMaj > 7 || (tMaj === 7 && (tMin > 5 || (tMin === 5 && tPatch >= 22))),
    `tar ${tarVersion} is below the advisory-clean floor 7.5.22 (GHSA-34x7-hfp2-rc4v and others)`
  )
  console.log(`packaged tar: ${tarVersion}`)

  // -------------------------------------------------------------------------
  // 3. Scaffold and verify each template.
  // -------------------------------------------------------------------------
  for (const template of templates) {
    console.log(`\n${"=".repeat(70)}\n== scaffolding "${template}"\n${"=".repeat(70)}`)

    const appsDir = path.join(workDir, "apps", template)
    fs.mkdirSync(appsDir, { recursive: true })
    const appName = `my-${template}-app`
    const appPath = path.join(appsDir, appName)

    const args = [appName, "--use-npm"]
    if (template !== "default") args.push("--example", template)

    // The README headline command. Must exit 0.
    sh(cli, args, { cwd: appsDir })

    assert.ok(fs.existsSync(appPath), `${template}: nothing was created at ${appPath}`)

    // The project must be named after the directory, not after whatever
    // upstream example it came from.
    const pkg = readJson(path.join(appPath, "package.json"))
    assert.strictEqual(pkg.name, appName, `${template}: project name is "${pkg.name}"`)
    assert.ok(
      /^0\./.test(pkg.version),
      `${template}: version "${pkg.version}" looks like a dependency version`
    )

    // The manifest must agree with what is actually on disk, on tRPC v11.
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    const trpcDeps = Object.keys(declared).filter((d) => d.startsWith("@trpc/"))
    assert.ok(trpcDeps.length > 0, `${template}: no @trpc/* dependency declared`)

    for (const dep of trpcDeps) {
      assert.strictEqual(
        majorOf(declared[dep]),
        TRPC_MAJOR,
        `${template}: manifest declares ${dep}@${declared[dep]}, expected v${TRPC_MAJOR}`
      )
      const installedVersion = readJson(
        path.join(appPath, "node_modules", dep, "package.json")
      ).version
      assert.strictEqual(
        majorOf(installedVersion),
        TRPC_MAJOR,
        `${template}: manifest says ${dep}@${declared[dep]} but ${installedVersion} is installed`
      )
      console.log(`  ${dep}: declared ${declared[dep]}, installed ${installedVersion}`)
    }

    // A README must exist and must not still credit the upstream author.
    const readme = fs.readFileSync(path.join(appPath, "README.md"), "utf8")
    assert.ok(!/alexdotjs/.test(readme), `${template}: README still credits @alexdotjs`)
    assert.ok(fs.existsSync(path.join(appPath, ".gitignore")), `${template}: no .gitignore`)

    // Run the scripts that prove it works, and assert on their output where
    // there is a marker worth asserting on. Exit 0 alone is what let these
    // templates ship broken.
    const EXPECT_OUTPUT = {
      // The client prints this only after every query and mutation has
      // round-tripped through the server.
      "default:test-dev": /Clean exit: every query and mutation above succeeded\./,
      "vite-react:build": /built in /,
      "nextjs-app:build": /Compiled successfully/,
    }

    for (const script of VERIFY[template]) {
      console.log(`\n-- ${template}: npm run ${script}`)
      const expected = EXPECT_OUTPUT[`${template}:${script}`]
      const out = sh("npm", ["run", script], { cwd: appPath, capture: !!expected })
      if (expected) {
        process.stdout.write(out)
        assert.match(out, expected, `${template}: "npm run ${script}" output did not match`)
      }
    }

    console.log(`\n  ok   ${template} scaffolds, installs tRPC v${TRPC_MAJOR}, and runs`)
  }

  console.log("\nAll scaffold tests passed.")
} finally {
  fs.rmSync(workDir, { recursive: true, force: true })
}
