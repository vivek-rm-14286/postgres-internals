// Installs the server into a stable per-user directory, so client configs never point into an npx cache.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export const SERVER_NAME = 'pg-internals'

export function installDir() {
  if (process.env.PG_INTERNALS_MCP_HOME) return path.resolve(process.env.PG_INTERNALS_MCP_HOME)
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'pg-internals-mcp')
  return path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'pg-internals-mcp')
}

export const serverPath = () => path.join(installDir(), 'server.mjs')
/**
 * Absolute path of node, so GUI-launched clients (which may not see nvm/Homebrew on PATH) can start the server.
 * Prefer the `node` on PATH when it is the same binary: /opt/homebrew/bin/node survives `brew upgrade`,
 * while process.execPath would point into a versioned Cellar directory.
 */
export function nodePath() {
  const exe = process.platform === 'win32' ? 'node.exe' : 'node'
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    const f = path.join(dir, exe)
    try { if (fs.realpathSync(f) === fs.realpathSync(process.execPath)) return f } catch { /* next */ }
  }
  return process.execPath
}
export const launch = () => ({ command: nodePath(), args: [serverPath()] })

const SRC = path.resolve(import.meta.dirname, '..')
const FILES = ['server.mjs', 'worker.mjs', 'split.mjs', 'package.json', 'package-lock.json']

export function isServerInstalled() {
  return fs.existsSync(serverPath()) && fs.existsSync(path.join(installDir(), 'node_modules', '@modelcontextprotocol', 'sdk'))
}

export function installedVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(installDir(), 'package.json'), 'utf8')).version } catch { return null }
}

export function installServer(log) {
  const dir = installDir()
  fs.mkdirSync(dir, { recursive: true })
  for (const f of FILES) if (fs.existsSync(path.join(SRC, f))) fs.copyFileSync(path.join(SRC, f), path.join(dir, f))
  fs.rmSync(path.join(dir, 'data'), { recursive: true, force: true })
  fs.cpSync(path.join(SRC, 'data'), path.join(dir, 'data'), { recursive: true })
  log(`Installing dependencies in ${dir} …`)
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const args = fs.existsSync(path.join(dir, 'package-lock.json')) ? ['ci', '--omit=dev'] : ['install', '--omit=dev']
  execFileSync(npm, [...args, '--no-audit', '--no-fund', '--loglevel=error'], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32' })
}

export function removeServer() {
  const dir = installDir()
  if (!fs.existsSync(dir)) return false
  // Guard against a misconfigured PG_INTERNALS_MCP_HOME pointing somewhere unrelated.
  if (!fs.existsSync(path.join(dir, 'server.mjs'))) throw new Error(`${dir} does not look like a pg-internals-mcp install; not deleting it`)
  fs.rmSync(dir, { recursive: true, force: true })
  return true
}

/** Smoke-test the installed server: start it over stdio and list its tools. */
export async function verifyServer() {
  const { Client } = await import(path.join(installDir(), 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js'))
  const { StdioClientTransport } = await import(path.join(installDir(), 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js'))
  const client = new Client({ name: 'pg-internals-setup', version: '1.0.0' })
  await client.connect(new StdioClientTransport({ ...launch(), stderr: 'ignore' }))
  const { tools } = await client.listTools()
  const r = await client.callTool({ name: 'run_sql', arguments: { sql: 'select version()' } })
  await client.close()
  return { tools: tools.map((t) => t.name), version: (r.content?.[0]?.text.match(/PostgreSQL [\d.]+/) ?? [''])[0] }
}
