/* Minimal tests for parseGitHub and chooseScript without a full test framework */
import assert from "assert"
import fs from "fs"
import os from "os"
import path from "path"
import { chooseScript, parseGitHub } from "../dist/helpers/run.js"

function withTmp(cb: (dir: string) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cta-test-"))
  try {
    cb(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

// Test parseGitHub variations
withTmp(() => {
  const a = parseGitHub("https://github.com/owner/repo")
  assert.deepStrictEqual(a, { owner: "owner", repo: "repo", branch: "main", subdir: "" })

  const b = parseGitHub("https://github.com/owner/repo/tree/feat/x/y")
  assert.deepStrictEqual(b, { owner: "owner", repo: "repo", branch: "feat", subdir: "x/y" })

  const c = parseGitHub(
    "https://github.com/owner/repo/tree/master/examples/with-nextjs",
    "examples/override"
  )
  assert.deepStrictEqual(c, {
    owner: "owner",
    repo: "repo",
    branch: "master",
    subdir: "examples/override",
  })
})

// Test chooseScript detection
withTmp((dir) => {
  const pkg = { name: "x", version: "1.0.0", scripts: { dev: "vite", start: "node server.js" } }
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2))
  assert.strictEqual(chooseScript(dir, undefined), "dev")
  assert.strictEqual(chooseScript(dir, "start"), "start")
})

console.log("All tests passed.")
