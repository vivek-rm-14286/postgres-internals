#!/usr/bin/env node
// pg-internals-mcp setup: detect AI tools on this machine, then install or uninstall the MCP server for the ones you pick.
//
//   npx -y github:vivek-rm-14286/postgres-internals             interactive menu
//   npx -y github:vivek-rm-14286/postgres-internals install     [--all | --clients a,b] [--yes]
//   npx -y github:vivek-rm-14286/postgres-internals uninstall   [--all | --clients a,b] [--yes] [--keep-files]
//   npx -y github:vivek-rm-14286/postgres-internals status
import { CLIENTS } from './lib/clients.mjs'
import { bold, confirm, cyan, dim, green, isInteractive, multiselect, red, select, yellow } from './lib/ui.mjs'
import { installDir, installServer, installedVersion, isServerInstalled, removeServer, SERVER_NAME, verifyServer } from './lib/install.mjs'

const argv = process.argv.slice(2)
const flag = (f) => argv.includes(f)
const opt = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined }
const cmd = argv.find((a) => !a.startsWith('-') && a !== opt('--clients'))
const log = (s = '') => console.log(s)

function scan() {
  return CLIENTS.map((c) => {
    let found = { found: false }, configured = false, error
    try { found = c.detect() } catch (e) { error = e.message }
    try { configured = found.found && c.configured() } catch (e) { error = e.message }
    return { c, ...found, configured, error }
  })
}

function printStatus(rows) {
  const v = installedVersion()
  log(`${bold('Server')}   ${isServerInstalled() ? green('installed') + dim(` v${v} · ${installDir()}`) : yellow('not installed')}`)
  log(bold('AI tools on this machine'))
  const w = Math.max(...rows.map((r) => r.c.name.length))
  for (const r of rows) {
    const state = !r.found ? dim('not found') : r.configured ? green('configured') : 'available'
    log(`  ${r.c.name.padEnd(w)}  ${state}${r.found && r.where ? dim('  ' + r.where) : ''}${r.error ? red('  ' + r.error) : ''}`)
  }
}

function pickByFlag(rows, want) {
  if (flag('--all')) return want
  const ids = (opt('--clients') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!ids.length) return null
  const unknown = ids.filter((id) => !CLIENTS.some((c) => c.id === id))
  if (unknown.length) throw new Error(`unknown client id(s): ${unknown.join(', ')}. Known: ${CLIENTS.map((c) => c.id).join(', ')}`)
  return rows.filter((r) => ids.includes(r.c.id))
}

async function install(rows) {
  const avail = rows.filter((r) => r.found)
  if (!avail.length) { log(yellow('No supported AI tools were found on this machine.')); log(`Supported: ${CLIENTS.map((c) => c.name).join(', ')}`); return }
  let chosen = pickByFlag(rows, avail)
  if (!chosen) {
    if (!isInteractive()) throw new Error('no terminal: pass --all or --clients <ids>')
    const items = avail.map((r) => ({ label: r.c.name, hint: r.configured ? 'already configured: will refresh' : r.c.hint ?? '', checked: !r.configured }))
    chosen = (await multiselect('Install the pg-internals MCP server into:', items)).map((i) => avail[i])
  }
  chosen = chosen.filter((r) => r.found)
  if (!chosen.length) { log('Nothing selected.'); return }

  log(`\n${bold('1/3')} Server files → ${installDir()}`)
  installServer((m) => log(dim('    ' + m)))
  log(`${bold('2/3')} Checking the server starts …`)
  const v = await verifyServer()
  log(green(`    ok: ${v.tools.length} tools, ${v.version} sandbox`))
  log(`${bold('3/3')} Registering with your tools`)
  const notes = []
  for (const r of chosen) {
    try {
      const res = r.c.add()
      log(`  ${green('✓')} ${r.c.name}${res?.detail ? dim('  ' + res.detail) : ''}`)
      if (res?.warning) log(`    ${yellow(res.warning)}`)
      if (r.c.after) notes.push(`${r.c.name}: ${r.c.after}`)
    } catch (e) { log(`  ${red('✗')} ${r.c.name}: ${e.message}`) }
  }
  log(`\n${green(bold('Done.'))} The server is registered as ${cyan(SERVER_NAME)}.`)
  for (const n of notes) log(dim('  • ' + n))
  log(dim('  Try asking your agent: "Use pg-internals to show what a HOT update does to the heap page."'))
}

async function uninstall(rows) {
  const configured = rows.filter((r) => r.configured)
  let chosen = pickByFlag(rows, configured)
  if (!chosen) {
    if (!configured.length) log(dim('No AI tool has pg-internals configured.'))
    else if (!isInteractive()) throw new Error('no terminal: pass --all or --clients <ids>')
    else chosen = (await multiselect('Remove pg-internals from:', configured.map((r) => ({ label: r.c.name, checked: true })))).map((i) => configured[i])
  }
  for (const r of chosen ?? []) {
    try { const res = r.c.remove(); log(`  ${green('✓')} removed from ${r.c.name}${res?.detail ? dim('  ' + res.detail) : ''}`) }
    catch (e) { log(`  ${red('✗')} ${r.c.name}: ${e.message}`) }
  }
  const still = scan().filter((r) => r.configured)
  if (flag('--keep-files')) return
  if (!isServerInstalled()) return
  if (still.length) { log(dim(`Server files kept: still used by ${still.map((r) => r.c.name).join(', ')}.`)); return }
  if (flag('--yes') || (await confirm(`Delete the server files in ${installDir()}?`, true))) { removeServer(); log(`  ${green('✓')} deleted ${installDir()}`) }
}

function help() {
  log(`${bold('pg-internals MCP')}: PostgreSQL 18 internals lessons, reference tables and a live PostgreSQL 18 sandbox for AI agents.

Usage: npx -y github:vivek-rm-14286/postgres-internals [command] [options]

Commands
  (none)      interactive menu
  install     install the server and register it with AI tools
  uninstall   unregister it, and delete the server files when no tool uses them
  status      show the server and which AI tools have it

Options
  --all              every detected tool (install) / every configured tool (uninstall)
  --clients a,b      specific tools: ${CLIENTS.map((c) => c.id).join(', ')}
  --yes              do not ask before deleting files
  --keep-files       uninstall: leave the server files in place

Install location: ${installDir()} (override with PG_INTERNALS_MCP_HOME)`)
}

async function main() {
  if (flag('--help') || flag('-h') || cmd === 'help') return help()
  const rows = scan()
  if (cmd === 'status' || cmd === 'list') return printStatus(rows)
  if (cmd === 'install') return install(rows)
  if (cmd === 'uninstall' || cmd === 'remove') return uninstall(rows)
  if (cmd) { help(); process.exitCode = 1; return }
  if (!isInteractive()) { printStatus(rows); log('\nRun with "install --all" or "--clients <ids>" when not in a terminal.'); return }
  log(bold('\npg-internals MCP setup\n'))
  printStatus(rows)
  log('')
  const choice = await select('What would you like to do?', ['Install / update for AI tools', 'Uninstall', 'Quit'])
  if (choice === 0) return install(rows)
  if (choice === 1) return uninstall(rows)
}

main().catch((e) => { console.error(red(`Error: ${e.message}`)); process.exit(1) })
