// Contract tests for the bundled templates, run against the built `dist/`.
//
// These exist because the templates shipped broken for a long time while the
// test suite stayed green: nothing asserted that `--example <bundled-name>`
// resolved, that the manifests targeted a supported tRPC major, or that the
// generated project was named after the user's directory.
import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  DEFAULT_TEMPLATE,
  isTemplate,
  listTemplates,
  personalizePackageJson,
  templateDir,
} from "../dist/helpers/templates.js"
import { copyTemplate, templateFileName } from "../dist/helpers/copy-template.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

/** The tRPC major this CLI scaffolds against. */
const TRPC_MAJOR = 11
const TRPC_PACKAGES = [
  "@trpc/server",
  "@trpc/client",
  "@trpc/react-query",
  "@trpc/next",
  "@trpc/tanstack-react-query",
]

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"))
}

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || "/tmp"), prefix))
}

// ---------------------------------------------------------------------------
// The templates the README advertises must exist and be selectable.
// ---------------------------------------------------------------------------
const templates = listTemplates()
assert.deepStrictEqual(
  templates,
  ["default", "nextjs-app", "vite-react"],
  `unexpected bundled template set: ${templates.join(", ")}`
)
assert.ok(templates.includes(DEFAULT_TEMPLATE), "the default template must be bundled")

for (const name of templates) {
  assert.strictEqual(isTemplate(name), true, `isTemplate("${name}") must be true`)
}
// A tRPC example name must NOT be mistaken for a bundled template.
assert.strictEqual(isTemplate("minimal"), false)
assert.strictEqual(isTemplate("../etc"), false)
console.log(`templates: ${templates.join(", ")} are all selectable`)

// ---------------------------------------------------------------------------
// Every template manifest must target the current tRPC major, and must not
// carry leftovers from the upstream example it was derived from.
// ---------------------------------------------------------------------------
for (const name of templates) {
  const pkg = readJson(path.join(templateDir(name), "package.json"))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  const trpcDeps = Object.keys(deps).filter((d) => TRPC_PACKAGES.includes(d))
  assert.ok(trpcDeps.length > 0, `${name}: declares no @trpc/* dependency`)

  for (const dep of trpcDeps) {
    const range = deps[dep]
    const major = Number(
      String(range)
        .replace(/^[^0-9]*/, "")
        .split(".")[0]
    )
    assert.strictEqual(
      major,
      TRPC_MAJOR,
      `${name}: ${dep} is "${range}", expected the v${TRPC_MAJOR} line`
    )
  }

  // `@trpc/server` and `@trpc/client` peer each other at an exact version, so a
  // template that pins one must pin the other on the same major.
  if (deps["@trpc/client"]) {
    assert.ok(deps["@trpc/server"], `${name}: has @trpc/client but no @trpc/server`)
  }

  assert.ok(!/^@examples\//.test(pkg.name), `${name}: still named after an upstream example`)
  assert.strictEqual(pkg.private, true, `${name}: generated projects must stay private`)
  assert.ok(!pkg.publishConfig, `${name}: publishConfig is a leftover from the upstream monorepo`)
  assert.ok(!pkg.alias, `${name}: "alias" is a leftover from the upstream monorepo`)

  // A version that tracks a dependency's version is how the default template
  // ended up claiming to be "10.45.2".
  assert.ok(
    /^0\./.test(pkg.version),
    `${name}: version "${pkg.version}" looks like a dependency version, not a project version`
  )

  assert.ok(pkg.engines?.node, `${name}: must declare engines.node`)

  // Every advertised script must exist, and none may hard-code a package
  // manager the user did not choose.
  for (const [script, body] of Object.entries(pkg.scripts ?? {})) {
    assert.ok(
      !/\b(pnpm|yarn)\b/.test(body),
      `${name}: script "${script}" hard-codes a package manager: ${body}`
    )
  }
  assert.ok(pkg.scripts?.dev || pkg.scripts?.start, `${name}: needs a dev or start script`)
}
console.log(`templates: all manifests target tRPC v${TRPC_MAJOR} and carry no upstream leftovers`)

// ---------------------------------------------------------------------------
// No template may reference a tRPC API that v11 removed or an import path that
// v11 does not publish.
// ---------------------------------------------------------------------------
const FORBIDDEN_SOURCE_PATTERNS = [
  [/@trpc\/client\/links\//, "deep link imports; import from @trpc/client root instead"],
  [/createTRPCProxyClient/, "deprecated alias; use createTRPCClient"],
  [/from ["']@trpc\/server\/adapters\/next["']/, "Pages Router adapter used in an App Router app"],
]

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) out.push(p)
  }
  return out
}

for (const name of templates) {
  for (const file of walk(templateDir(name))) {
    const src = fs.readFileSync(file, "utf8")
    for (const [pattern, why] of FORBIDDEN_SOURCE_PATTERNS) {
      // The App Router check only applies to the App Router template.
      if (String(pattern).includes("adapters/next") && name !== "nextjs-app") continue
      assert.ok(!pattern.test(src), `${path.relative(repoRoot, file)}: ${why} (matched ${pattern})`)
    }
  }
}
console.log("templates: no removed or deprecated tRPC import paths")

// ---------------------------------------------------------------------------
// The Next.js template calls itself App Router, so it must actually be one.
// ---------------------------------------------------------------------------
{
  const dir = templateDir("nextjs-app")
  assert.ok(
    fs.existsSync(path.join(dir, "src", "app", "layout.tsx")),
    "nextjs-app: App Router needs src/app/layout.tsx"
  )
  assert.ok(
    fs.existsSync(path.join(dir, "src", "app", "page.tsx")),
    "nextjs-app: App Router needs src/app/page.tsx"
  )
  const route = path.join(dir, "src", "app", "api", "trpc", "[trpc]", "route.ts")
  assert.ok(fs.existsSync(route), "nextjs-app: missing the tRPC route handler")
  assert.match(
    fs.readFileSync(route, "utf8"),
    /fetchRequestHandler/,
    "nextjs-app: the App Router handler must use the Fetch adapter"
  )
  assert.ok(
    !fs.existsSync(path.join(dir, "src", "pages")),
    "nextjs-app: must not mix in a Pages Router directory"
  )
  // A provider is what the old template was missing, so useQuery threw.
  const provider = fs.readFileSync(path.join(dir, "src", "trpc", "client.tsx"), "utf8")
  assert.match(provider, /QueryClientProvider/, "nextjs-app: no QueryClientProvider")
  assert.match(provider, /TRPCProvider/, "nextjs-app: no TRPCProvider")
}
console.log("nextjs-app: is a real App Router app with a Fetch-adapter route and a provider")

// ---------------------------------------------------------------------------
// The Vite template must ship a server to talk to and a React plugin.
// ---------------------------------------------------------------------------
{
  const dir = templateDir("vite-react")
  assert.ok(fs.existsSync(path.join(dir, "vite.config.ts")), "vite-react: missing vite.config.ts")
  assert.match(
    fs.readFileSync(path.join(dir, "vite.config.ts"), "utf8"),
    /@vitejs\/plugin-react/,
    "vite-react: JSX needs @vitejs/plugin-react"
  )
  assert.ok(
    fs.existsSync(path.join(dir, "server", "index.ts")),
    "vite-react: the client needs a server to call"
  )
  const pkg = readJson(path.join(dir, "package.json"))
  assert.ok(pkg.scripts["dev:server"], "vite-react: needs a dev:server script")
  assert.ok(pkg.devDependencies["@vitejs/plugin-react"], "vite-react: plugin must be a devDep")
}
console.log("vite-react: ships a server, a React plugin and a script to run both")

// ---------------------------------------------------------------------------
// copyTemplate must restore dotted filenames and preserve bracketed Next.js
// route directories.
// ---------------------------------------------------------------------------
assert.strictEqual(templateFileName("gitignore"), ".gitignore")
assert.strictEqual(templateFileName("README-template.md"), "README.md")
assert.strictEqual(templateFileName("package.json"), "package.json")

{
  const dest = tmpDir("cta-copy-")
  try {
    await copyTemplate(templateDir("nextjs-app"), dest)
    assert.ok(fs.existsSync(path.join(dest, ".gitignore")), "gitignore was not renamed")
    assert.ok(fs.existsSync(path.join(dest, "README.md")), "README-template.md was not renamed")
    assert.ok(!fs.existsSync(path.join(dest, "gitignore")), "undotted gitignore leaked through")
    assert.ok(
      fs.existsSync(path.join(dest, "src", "app", "api", "trpc", "[trpc]", "route.ts")),
      "the bracketed dynamic route directory was not copied"
    )
  } finally {
    fs.rmSync(dest, { recursive: true, force: true })
  }
}
console.log("copyTemplate: renames dotfiles and preserves [trpc] route directories")

// ---------------------------------------------------------------------------
// personalizePackageJson must rename the project after the user's directory,
// keep key order stable, and leave everything else untouched.
// ---------------------------------------------------------------------------
{
  const dest = tmpDir("cta-name-")
  try {
    await copyTemplate(templateDir(DEFAULT_TEMPLATE), dest)
    const before = readJson(path.join(dest, "package.json"))
    personalizePackageJson(dest, "my-cool-app")
    const after = readJson(path.join(dest, "package.json"))

    assert.strictEqual(after.name, "my-cool-app")
    assert.strictEqual(after.version, "0.1.0")
    assert.strictEqual(Object.keys(after)[0], "name")
    assert.strictEqual(Object.keys(after)[1], "version")
    assert.deepStrictEqual(after.dependencies, before.dependencies)
    assert.deepStrictEqual(after.devDependencies, before.devDependencies)
    assert.deepStrictEqual(after.scripts, before.scripts)
  } finally {
    fs.rmSync(dest, { recursive: true, force: true })
  }
}
console.log("personalizePackageJson: renames the project and preserves the rest")

console.log("All template tests passed.")
