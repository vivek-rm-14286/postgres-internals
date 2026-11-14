// One adapter per AI tool: how to detect it, where its MCP config lives, and how to add / remove the entry.
// Formats verified against each tool's official docs or source (November 2026).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import YAML from 'yaml'
import { jsonDelete, jsonHas, jsonSet, readJson, tomlDelete, tomlHas, tomlSet, trackedRestore, trackedWrite } from './files.mjs'
import { launch, SERVER_NAME } from './install.mjs'

const HOME = os.homedir()
const WIN = process.platform === 'win32', MAC = process.platform === 'darwin'
const APPDATA = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming')
const XDG = process.env.XDG_CONFIG_HOME || path.join(HOME, '.config')
const h = (...p) => path.join(HOME, ...p)
const exists = (p) => !!p && fs.existsSync(p)
const tilde = (p) => (p.startsWith(HOME) ? '~' + p.slice(HOME.length) : p)

export function onPath(bin) {
  const exts = WIN ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : ['']
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    for (const e of exts) { const f = path.join(dir, bin + e); try { if (fs.statSync(f).isFile()) return f } catch { /* next */ } }
  }
  return null
}

const firstFound = (bins = [], paths = []) => {
  for (const b of bins) { const p = onPath(b); if (p) return { found: true, where: tilde(p) } }
  for (const p of paths) if (exists(p)) return { found: true, where: tilde(p) }
  return { found: false }
}

/** Generic adapter for tools whose config is a JSON/JSONC file with a map of servers under `keys`. */
function jsonClient({ id, name, bins, paths, file, keys, entry, after, hint }) {
  const files = () => [file()].flat().filter(Boolean)
  return {
    id, name, after, hint,
    detect: () => firstFound(bins, paths?.()),
    configured: () => files().some((f) => jsonHas(f, keys, SERVER_NAME)),
    add() {
      const out = files().map((f) => ({ f, ...jsonSet(f, keys, SERVER_NAME, entry(launch())) }))
      return { detail: out.map((o) => tilde(o.f)).join(', ') }
    },
    remove() {
      const out = files().map((f) => ({ f, ...jsonDelete(f, keys, SERVER_NAME) })).filter((o) => o.changed)
      return { detail: out.map((o) => tilde(o.f)).join(', ') }
    },
  }
}

const std = ({ command, args }) => ({ command, args })

/* ---------------------------------------------------------------------------------------- Claude Code */
// The docs say not to hand-edit ~/.claude.json; the `claude mcp` CLI owns it. Read-only checks use the file.
const claudeJson = () => (process.env.CLAUDE_CONFIG_DIR ? path.join(process.env.CLAUDE_CONFIG_DIR, '.claude.json') : h('.claude.json'))
const claude = (args) => execFileSync(onPath('claude') ?? 'claude', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: WIN, timeout: 60000 })
const claudeCode = {
  id: 'claude-code', name: 'Claude Code',
  detect: () => firstFound(['claude']),
  configured: () => jsonHas(claudeJson(), ['mcpServers'], SERVER_NAME),
  add() {
    try { claude(['mcp', 'remove', SERVER_NAME, '-s', 'user']) } catch { /* not there yet */ }
    const { command, args } = launch()
    claude(['mcp', 'add', '--transport', 'stdio', '--scope', 'user', SERVER_NAME, '--', command, ...args])
    return { detail: 'user scope (all projects)' }
  },
  remove() { claude(['mcp', 'remove', SERVER_NAME, '-s', 'user']); return { detail: 'user scope' } },
  after: 'available in new sessions; /mcp shows it',
}

/* ---------------------------------------------------------------------------------------- Codex CLI (TOML) */
const codexToml = () => path.join(process.env.CODEX_HOME || h('.codex'), 'config.toml')
const codex = {
  id: 'codex', name: 'OpenAI Codex CLI',
  detect: () => firstFound(['codex'], [process.env.CODEX_HOME || h('.codex')]),
  configured: () => tomlHas(codexToml(), `mcp_servers.${SERVER_NAME}`),
  add() {
    const { command, args } = launch()
    tomlSet(codexToml(), `mcp_servers.${SERVER_NAME}`, `command = ${JSON.stringify(command)}\nargs = ${JSON.stringify(args)}\nstartup_timeout_sec = 30`)
    return { detail: tilde(codexToml()) }
  },
  remove() { tomlDelete(codexToml(), `mcp_servers.${SERVER_NAME}`); return { detail: tilde(codexToml()) } },
  after: 'also used by the Codex IDE extension and desktop app',
}

/* ---------------------------------------------------------------------------------------- Goose (YAML) */
const gooseYaml = () => (WIN ? path.join(APPDATA, 'Block', 'goose', 'config', 'config.yaml') : path.join(XDG, 'goose', 'config.yaml'))
const goose = {
  id: 'goose', name: 'Goose',
  detect: () => firstFound(['goose'], [path.dirname(gooseYaml())]),
  configured: () => { try { return !!YAML.parseDocument(fs.readFileSync(gooseYaml(), 'utf8')).getIn(['extensions', SERVER_NAME]) } catch { return false } },
  add() {
    const f = gooseYaml()
    const doc = exists(f) ? YAML.parseDocument(fs.readFileSync(f, 'utf8')) : new YAML.Document({})
    const { command, args } = launch()
    doc.setIn(['extensions', SERVER_NAME], { type: 'stdio', name: SERVER_NAME, enabled: true, cmd: command, args, envs: {}, env_keys: [], timeout: 300 })
    trackedWrite(f, String(doc))
    return { detail: tilde(f) }
  },
  remove() {
    const f = gooseYaml()
    trackedRestore(f, (cur) => { const doc = YAML.parseDocument(cur); return doc.deleteIn(['extensions', SERVER_NAME]) ? String(doc) : cur })
    return { detail: tilde(f) }
  },
  after: 'restart Goose sessions to load it',
}

/* ---------------------------------------------------------------------------------------- JSON-config tools */
const claudeDesktopDir = MAC ? h('Library', 'Application Support', 'Claude') : WIN ? path.join(APPDATA, 'Claude') : path.join(XDG, 'Claude')
const vscodeUser = (flavour) => (MAC ? h('Library', 'Application Support', flavour, 'User') : WIN ? path.join(APPDATA, flavour, 'User') : path.join(XDG, flavour, 'User'))
const zedDir = WIN ? path.join(APPDATA, 'Zed') : process.env.FLATPAK_XDG_CONFIG_HOME ? path.join(process.env.FLATPAK_XDG_CONFIG_HOME, 'zed') : path.join(XDG, 'zed')
const copilotHome = () => process.env.COPILOT_HOME || h('.copilot')
const piDir = () => process.env.PI_CODING_AGENT_DIR || h('.pi', 'agent')
const opencodeFile = () => {
  const dir = path.join(XDG, 'opencode')
  return ['opencode.jsonc', 'opencode.json'].map((f) => path.join(dir, f)).find(exists) ?? path.join(dir, 'opencode.json')
}
const devinFiles = () => {
  const c = [WIN ? path.join(APPDATA, 'devin', 'mcp_config.json') : path.join(XDG, 'devin', 'mcp_config.json'), h('.codeium', 'mcp_config.json'), h('.codeium', 'windsurf', 'mcp_config.json')]
  const present = c.filter(exists)
  if (present.length) return present
  return [exists(h('.codeium', 'windsurf')) ? h('.codeium', 'windsurf', 'mcp_config.json') : c[0]]
}
const clineFiles = () => {
  const main = process.env.CLINE_MCP_SETTINGS_PATH || h('.cline', 'data', 'settings', 'cline_mcp_settings.json')
  const legacy = path.join(vscodeUser('Code'), 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
  return [main, ...(exists(legacy) ? [legacy] : [])]
}

const jsonClients = [
  jsonClient({
    id: 'claude-desktop', name: 'Claude Desktop', paths: () => [MAC && '/Applications/Claude.app', claudeDesktopDir],
    file: () => path.join(claudeDesktopDir, 'claude_desktop_config.json'), keys: ['mcpServers'], entry: std,
    after: 'quit Claude Desktop completely and reopen it',
  }),
  jsonClient({
    id: 'cursor', name: 'Cursor', bins: ['cursor'], paths: () => [h('.cursor'), MAC && '/Applications/Cursor.app'],
    file: () => h('.cursor', 'mcp.json'), keys: ['mcpServers'], entry: (l) => ({ type: 'stdio', ...std(l) }),
    after: 'restart Cursor, then enable it under Settings → MCP if prompted',
  }),
  jsonClient({
    id: 'vscode', name: 'VS Code (GitHub Copilot)', bins: ['code'], paths: () => [vscodeUser('Code'), MAC && '/Applications/Visual Studio Code.app'],
    file: () => path.join(vscodeUser('Code'), 'mcp.json'), keys: ['servers'], entry: (l) => ({ type: 'stdio', ...std(l) }),
    after: 'in VS Code run "MCP: List Servers" and start pg-internals (trust it when asked)',
  }),
  jsonClient({
    id: 'vscode-insiders', name: 'VS Code Insiders (GitHub Copilot)', bins: ['code-insiders'], paths: () => [vscodeUser('Code - Insiders')],
    file: () => path.join(vscodeUser('Code - Insiders'), 'mcp.json'), keys: ['servers'], entry: (l) => ({ type: 'stdio', ...std(l) }),
    after: 'in VS Code Insiders run "MCP: List Servers" and start pg-internals',
  }),
  jsonClient({
    id: 'copilot-cli', name: 'GitHub Copilot CLI', bins: ['copilot'], paths: () => [copilotHome()],
    file: () => path.join(copilotHome(), 'mcp-config.json'), keys: ['mcpServers'], entry: (l) => ({ type: 'local', ...std(l), env: {}, tools: ['*'] }),
    after: 'new copilot sessions load it; /mcp shows it',
  }),
  jsonClient({
    id: 'opencode', name: 'OpenCode', bins: ['opencode'], paths: () => [path.join(XDG, 'opencode')],
    file: opencodeFile, keys: ['mcp'], entry: ({ command, args }) => ({ type: 'local', command: [command, ...args], enabled: true }),
    after: 'restart opencode to load it',
  }),
  jsonClient({
    id: 'pi', name: 'pi', bins: ['pi'], paths: () => [piDir()],
    file: () => path.join(piDir(), 'mcp.json'), keys: ['mcpServers'], entry: (l) => ({ ...std(l), exposure: 'direct' }),
    after: 'run /reload in open pi sessions (an installed pi-mcp-adapter extension overrides built-in MCP)',
  }),
  jsonClient({
    id: 'gemini', name: 'Gemini CLI', bins: ['gemini'], paths: () => [process.env.GEMINI_CLI_HOME ? path.join(process.env.GEMINI_CLI_HOME, '.gemini') : h('.gemini')],
    file: () => path.join(process.env.GEMINI_CLI_HOME || HOME, '.gemini', 'settings.json'), keys: ['mcpServers'], entry: (l) => ({ ...std(l), timeout: 60000 }),
    after: 'new gemini sessions load it; /mcp shows it',
  }),
  jsonClient({
    id: 'antigravity', name: 'Antigravity', bins: ['antigravity', 'agy'], paths: () => [h('.gemini', 'config'), MAC && '/Applications/Antigravity.app'],
    file: () => h('.gemini', 'config', 'mcp_config.json'), keys: ['mcpServers'], entry: std,
    after: 'refresh MCP servers in Antigravity',
  }),
  jsonClient({
    id: 'windsurf', name: 'Windsurf / Devin Desktop', bins: ['devin', 'windsurf'],
    paths: () => [h('.codeium', 'windsurf'), h('.codeium'), path.join(XDG, 'devin'), MAC && '/Applications/Windsurf.app', MAC && '/Applications/Devin.app'],
    file: devinFiles, keys: ['mcpServers'], entry: std,
    after: 'press refresh in the MCP panel (Cascade → MCP servers)',
  }),
  jsonClient({
    id: 'zed', name: 'Zed', bins: ['zed', 'zeditor'], paths: () => [zedDir, MAC && '/Applications/Zed.app'],
    file: () => path.join(zedDir, 'settings.json'), keys: ['context_servers'], entry: (l) => ({ ...std(l), env: {} }),
    after: 'check the Agent panel settings; restart Zed if it does not appear',
  }),
  jsonClient({
    id: 'cline', name: 'Cline', paths: () => [h('.cline'), path.join(vscodeUser('Code'), 'globalStorage', 'saoudrizwan.claude-dev')],
    file: clineFiles, keys: ['mcpServers'], entry: (l) => ({ ...std(l), env: {}, disabled: false, autoApprove: [], timeout: 60 }),
    after: 'open Cline → MCP Servers to confirm it is running',
  }),
  jsonClient({
    id: 'kiro', name: 'Kiro', bins: ['kiro', 'kiro-cli'], paths: () => [h('.kiro')],
    file: () => h('.kiro', 'settings', 'mcp.json'), keys: ['mcpServers'], entry: (l) => ({ ...std(l), disabled: false }),
    after: 'Kiro reloads MCP config automatically',
  }),
]

// Display order: Claude Code, Claude Desktop, Cursor, VS Code, VS Code Insiders, Copilot CLI, OpenCode, pi, Codex,
// Gemini CLI, Antigravity, Windsurf/Devin, Zed, Cline, Kiro, Goose.
export const CLIENTS = [claudeCode, ...jsonClients.slice(0, 7), codex, ...jsonClients.slice(7), goose]
export { readJson }
