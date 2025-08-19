import { execSync } from 'child_process';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export function getPkgManager(): PackageManager {
  try {
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent) {
      if (userAgent.startsWith('yarn')) return 'yarn';
      if (userAgent.startsWith('pnpm')) return 'pnpm';
      if (userAgent.startsWith('bun')) return 'bun';
    }
    // Try bun
    try {
      execSync('bun --version', { stdio: 'ignore' });
      return 'bun';
    } catch {}
    // Try yarn via Corepack
    try {
      execSync('corepack enable yarn', { stdio: 'ignore' });
      execSync('yarn --version', { stdio: 'ignore' });
      return 'yarn';
    } catch {}
    // Try pnpm via Corepack
    try {
      execSync('corepack enable pnpm', { stdio: 'ignore' });
      execSync('pnpm --version', { stdio: 'ignore' });
      return 'pnpm';
    } catch {}
    // Fallback to npm
    return 'npm';
  } catch {
    return 'npm';
  }
}
