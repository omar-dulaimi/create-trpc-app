import assert from "node:assert"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { detectPackageManager } from "../dist/helpers/run.js"

function withTmp(cb) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cta-pm-"))
  try {
    cb(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

// Prefer npm with package-lock.json
withTmp((dir) => {
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", version: "1.0.0" }))
  fs.writeFileSync(path.join(dir, "package-lock.json"), "{}")
  assert.strictEqual(detectPackageManager(dir), "npm")
})

// Prefer pnpm with pnpm-lock.yaml
withTmp((dir) => {
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", version: "1.0.0" }))
  fs.writeFileSync(path.join(dir, "pnpm-lock.yaml"), "")
  assert.strictEqual(detectPackageManager(dir), "pnpm")
})

// Prefer yarn with yarn.lock
withTmp((dir) => {
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "x", version: "1.0.0" }))
  fs.writeFileSync(path.join(dir, "yarn.lock"), "")
  assert.strictEqual(detectPackageManager(dir), "yarn")
})

// Workspaces non-private should default to npm to avoid yarn classic errors
withTmp((dir) => {
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "x", version: "1.0.0", workspaces: ["apps/*"] })
  )
  assert.strictEqual(detectPackageManager(dir), "npm")
})

console.log("pm tests passed")
