import { Fragment, type ReactNode } from 'react'

/** Tiny inline formatter for lesson strings: **bold**, `code`, *emphasis*. No block syntax, no HTML. */
export function Md({ children }: { children: string }) {
  return <>{format(children)}</>
}

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g

export function format(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>
    return <Fragment key={i}>{part}</Fragment>
  })
}
