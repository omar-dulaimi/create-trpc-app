// Minimal ESM tests for parseGitHub and chooseScript using the built dist
import assert from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chooseScript, findFreePort, parseGitHub, resolveRunnableDir, sha256File } from '../dist/helpers/run.js'

function withTmp(cb) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cta-test-'))
  try {
    const r = cb(dir)
    if (r && typeof r.then === 'function') {
      // async path: cleanup after promise settles
      return r.finally(() => fs.rmSync(dir, { recursive: true, force: true }))
    } else {
      // sync path: cleanup immediately
      fs.rmSync(dir, { recursive: true, force: true })
      return r
    }
  } catch (e) {
    // ensure cleanup on throw
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
    throw e
  }
}

// Test parseGitHub variations
withTmp(() => {
  const a = parseGitHub('https://github.com/owner/repo')
  assert.deepStrictEqual(a, { owner: 'owner', repo: 'repo', branch: 'main', subdir: '' })

  const b = parseGitHub('https://github.com/owner/repo/tree/feat/x/y')
  assert.deepStrictEqual(b, { owner: 'owner', repo: 'repo', branch: 'feat', subdir: 'x/y' })

  const c = parseGitHub('https://github.com/owner/repo/tree/master/examples/with-nextjs', 'examples/override')
  assert.deepStrictEqual(c, { owner: 'owner', repo: 'repo', branch: 'master', subdir: 'examples/override' })

  // SSH form
  const d = parseGitHub('git@github.com:owner/repo.git#dev')
  assert.deepStrictEqual(d, { owner: 'owner', repo: 'repo', branch: 'dev', subdir: '' })

  // Short form
  const e = parseGitHub('owner/repo#feat')
  assert.deepStrictEqual(e, { owner: 'owner', repo: 'repo', branch: 'feat', subdir: '' })
})

// Test chooseScript detection
withTmp((dir) => {
  const pkg = { name: 'x', version: '1.0.0', scripts: { dev: 'vite', start: 'node server.js' } }
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2))
  assert.strictEqual(chooseScript(dir, undefined), 'dev')
  assert.strictEqual(chooseScript(dir, 'start'), 'start')
})

console.log('All tests passed.')

// Quick port finder smoke
const p = await findFreePort(49152);
assert.ok(Number.isInteger(p) && p >= 49152);
console.log('findFreePort test passed.')

// resolveRunnableDir heuristic
withTmp(async (root) => {
  // workspace root
  const wsPkg = { name: 'root', private: true, workspaces: ['packages/*'] }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(wsPkg, null, 2))
  const appDir = path.join(root, 'packages', 'web-app')
  fs.mkdirSync(appDir, { recursive: true })
  fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({ name: 'web-app', scripts: { dev: 'vite' } }, null, 2))
  const serverDir = path.join(root, 'packages', 'server')
  fs.mkdirSync(serverDir, { recursive: true })
  fs.writeFileSync(path.join(serverDir, 'package.json'), JSON.stringify({ name: 'server', scripts: { start: 'node server.js' } }, null, 2))
  const chosen = await resolveRunnableDir(root)
  assert.ok([appDir, serverDir].includes(chosen))
})
console.log('resolveRunnableDir test passed.')

// sha256File
await withTmp(async (dir) => {
  const fp = path.join(dir, 'x.txt')
  fs.writeFileSync(fp, 'hello')
  const hash = await sha256File(fp)
  assert.strictEqual(typeof hash, 'string')
  assert.strictEqual(hash.length, 64)
})
console.log('sha256File test passed.')
