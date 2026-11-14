// Tiny, dependency-free terminal UI: colours, a checkbox multiselect, a single-choice menu, and a yes/no prompt.
import readline from 'node:readline'

const tty = process.stdout.isTTY && process.stdin.isTTY
const NO_COLOR = !!process.env.NO_COLOR || !process.stdout.isTTY
const c = (code) => (s) => (NO_COLOR ? String(s) : `\x1b[${code}m${s}\x1b[0m`)
export const bold = c('1'), dim = c('2'), green = c('32'), red = c('31'), yellow = c('33'), cyan = c('36')
export const isInteractive = () => tty

function onKeys(handler) {
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve) => {
    const listener = (str, key) => {
      if (key?.ctrl && key.name === 'c') { cleanup(); process.stdout.write('\x1b[?25h\n'); process.exit(130) }
      const done = handler(str, key)
      if (done !== undefined) { cleanup(); resolve(done) }
    }
    const cleanup = () => { process.stdin.off('keypress', listener); process.stdin.setRawMode(false); process.stdin.pause() }
    process.stdin.on('keypress', listener)
  })
}

/** Checkbox list. items: [{ label, hint?, checked?, disabled? }]. Returns the indices chosen. */
export async function multiselect(title, items) {
  if (!tty) throw new Error('not a terminal')
  let cur = Math.max(0, items.findIndex((i) => !i.disabled))
  const sel = items.map((i) => !!i.checked && !i.disabled)
  let lines = 0
  const draw = () => {
    if (lines) process.stdout.write(`\x1b[${lines}A\x1b[0J`)
    const out = [`${bold(title)}  ${dim('↑/↓ move · space toggle · a all · enter confirm')}`]
    items.forEach((it, i) => {
      const box = it.disabled ? dim('[-]') : sel[i] ? green('[x]') : '[ ]'
      const label = it.disabled ? dim(it.label) : i === cur ? cyan(it.label) : it.label
      out.push(`${i === cur ? cyan('›') : ' '} ${box} ${label}${it.hint ? '  ' + dim(it.hint) : ''}`)
    })
    process.stdout.write('\x1b[?25l' + out.join('\n') + '\n')
    lines = out.length
  }
  draw()
  const move = (d) => { let n = cur; do { n = (n + d + items.length) % items.length } while (items[n].disabled && n !== cur); cur = n }
  const res = await onKeys((_s, k) => {
    if (k?.name === 'up' || k?.name === 'k') move(-1)
    else if (k?.name === 'down' || k?.name === 'j') move(1)
    else if (k?.name === 'space' && !items[cur].disabled) sel[cur] = !sel[cur]
    else if (k?.name === 'a') { const all = items.every((it, i) => it.disabled || sel[i]); items.forEach((it, i) => { if (!it.disabled) sel[i] = !all }) }
    else if (k?.name === 'return') return sel.flatMap((s, i) => (s ? [i] : []))
    else if (k?.name === 'escape' || k?.name === 'q') return []
    draw()
  })
  process.stdout.write('\x1b[?25h')
  return res
}

/** Single choice menu. Returns the chosen index. */
export async function select(title, options) {
  if (!tty) throw new Error('not a terminal')
  let cur = 0, lines = 0
  const draw = () => {
    if (lines) process.stdout.write(`\x1b[${lines}A\x1b[0J`)
    const out = [`${bold(title)}  ${dim('↑/↓ · enter')}`, ...options.map((o, i) => `${i === cur ? cyan('› ' + o) : '  ' + o}`)]
    process.stdout.write('\x1b[?25l' + out.join('\n') + '\n')
    lines = out.length
  }
  draw()
  const res = await onKeys((_s, k) => {
    if (k?.name === 'up' || k?.name === 'k') cur = (cur - 1 + options.length) % options.length
    else if (k?.name === 'down' || k?.name === 'j') cur = (cur + 1) % options.length
    else if (k?.name === 'return') return cur
    else if (k?.name === 'escape' || k?.name === 'q') return -1
    draw()
  })
  process.stdout.write('\x1b[?25h')
  return res
}

export async function confirm(question, def = true) {
  if (!tty) return def
  process.stdout.write(`${question} ${dim(def ? '[Y/n]' : '[y/N]')} `)
  const ans = await onKeys((s, k) => {
    if (k?.name === 'return') return def
    if (/^[yY]$/.test(s ?? '')) return true
    if (/^[nN]$/.test(s ?? '')) return false
  })
  process.stdout.write((ans ? 'yes' : 'no') + '\n')
  return ans
}
