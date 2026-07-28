import fs from "fs"
import path from "path"

/**
 * Files that are stored under a neutral name inside `templates/` so that they
 * are not interpreted by tooling in this repository, and are restored to their
 * dotted/real name when copied into a generated app.
 */
const RENAMES: Record<string, string> = {
  gitignore: ".gitignore",
  "eslintrc.json": ".eslintrc.json",
  "README-template.md": "README.md",
}

export function templateFileName(name: string): string {
  return RENAMES[name] ?? name
}

/**
 * Recursively copy a bundled template directory into `dest`, applying the
 * rename table above. Uses only `node:fs`, so the CLI ships no glob/copy
 * dependency.
 */
export async function copyTemplate(templateDir: string, dest: string): Promise<void> {
  const entries = await fs.promises.readdir(templateDir, { withFileTypes: true })
  await fs.promises.mkdir(dest, { recursive: true })

  for (const entry of entries) {
    const from = path.join(templateDir, entry.name)
    const to = path.join(dest, templateFileName(entry.name))

    if (entry.isDirectory()) {
      await copyTemplate(from, to)
    } else if (entry.isFile()) {
      await fs.promises.copyFile(from, to)
    }
    // Symlinks and other special entries are intentionally skipped: templates
    // are plain source trees and a symlink here could escape `dest`.
  }
}
