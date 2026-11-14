import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Tiny inline formatter for lesson strings: **bold**, `code`, *emphasis*, and links: [label](/m4/btree) for another
 * lesson or page on this site, [label](https://…) for an external page. No block syntax, no HTML.
 */
export function Md({ children }: { children: string }) {
  return <>{format(children)}</>
}

const TOKEN = /(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/

export function format(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    const link = LINK.exec(part)
    if (link) {
      const [, label, href] = link
      const inner = format(label)
      return href.startsWith('/')
        ? <Link key={i} to={href} className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">{inner}</Link>
        : <a key={i} href={href} target="_blank" rel="noreferrer" className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">{inner}</a>
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>
    return <Fragment key={i}>{part}</Fragment>
  })
}
