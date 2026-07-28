import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type TemplateName = string

export const DEFAULT_TEMPLATE = "default"

/**
 * `templates/` sits next to the bundled entry point after `npm run build`
 * (`cp -r templates dist`), and one level up when running from source.
 */
export function templatesRoot(): string {
  const candidates = [
    path.resolve(__dirname, "templates"),
    path.resolve(__dirname, "..", "templates"),
    path.resolve(__dirname, "..", "..", "templates"),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, DEFAULT_TEMPLATE, "package.json"))) return dir
  }
  return candidates[0]
}

/** Directory names under `templates/` that contain a package.json. */
export function listTemplates(): TemplateName[] {
  const root = templatesRoot()
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, "package.json")))
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
}

export function isTemplate(name: string): boolean {
  return listTemplates().includes(name)
}

export function templateDir(name: TemplateName): string {
  return path.join(templatesRoot(), name)
}

/**
 * Templates ship with a placeholder `name`/`version`. Rewrite them to match the
 * directory the user actually asked for, so the generated project is not named
 * after whatever example it was derived from.
 */
export function personalizePackageJson(root: string, appName: string): void {
  const pkgPath = path.join(root, "package.json")
  let raw: string
  try {
    raw = fs.readFileSync(pkgPath, "utf8")
  } catch {
    return
  }

  let pkg: Record<string, unknown>
  try {
    pkg = JSON.parse(raw)
  } catch {
    return
  }

  const next: Record<string, unknown> = { name: appName, version: "0.1.0" }
  for (const [key, value] of Object.entries(pkg)) {
    if (key === "name" || key === "version") continue
    next[key] = value
  }

  fs.writeFileSync(pkgPath, JSON.stringify(next, null, 2) + "\n", "utf8")
}
