import { Fragment, type ReactNode } from 'react'
import { validLink } from '@/fields/editorial'

type Node = { type?: string; text?: string; format?: number | string; tag?: string; listType?: string; url?: string;
  fields?: { url?: string; newTab?: boolean }; children?: Node[]; root?: Node }

function render(node: Node, key: string, depth: number): ReactNode {
  if (depth > 32) return null
  if (node.type === 'text') {
    let content: ReactNode = node.text || ''
    const format = typeof node.format === 'number' ? node.format : 0
    if (format & 1) content = <strong>{content}</strong>
    if (format & 2) content = <em>{content}</em>
    if (format & 4) content = <s>{content}</s>
    if (format & 8) content = <u>{content}</u>
    if (format & 16) content = <code>{content}</code>
    return <Fragment key={key}>{content}</Fragment>
  }
  const children = node.children?.map((child, i) => render(child, `${key}-${i}`, depth + 1))
  switch (node.type) {
    case 'paragraph': return <p key={key}>{children}</p>
    case 'heading': {
      const Heading = node.tag === 'h3' ? 'h3' : node.tag === 'h4' ? 'h4' : 'h2'
      return <Heading key={key} id={`section-${key}`}>{children}</Heading>
    }
    case 'list': return node.listType === 'number' ? <ol key={key}>{children}</ol> : <ul key={key}>{children}</ul>
    case 'listitem': return <li key={key}>{children}</li>
    case 'quote': return <blockquote key={key}>{children}</blockquote>
    case 'linebreak': return <br key={key} />
    case 'horizontalrule': return <hr key={key} />
    case 'link': case 'autolink': {
      const url = node.fields?.url || node.url
      return url && validLink(url) === true ? <a key={key} href={url} rel="noopener noreferrer">{children}</a> : <Fragment key={key}>{children}</Fragment>
    }
    default: return <Fragment key={key}>{children}</Fragment>
  }
}

export function RichText({ value, className = '' }: { value?: unknown; className?: string }) {
  if (!value || typeof value !== 'object') return null
  const root = (value as Node).root || value as Node
  return <div className={`rich-text ${className}`}>{root.children?.map((node, i) => render(node, String(i), 0))}</div>
}

export function Contents({ value }: { value?: unknown }) {
  const root = (value as Node | undefined)?.root
  const items = root?.children?.flatMap((node, i) => node.type === 'heading' ? [{ id: `section-${i}`, text: node.children?.map((child) => child.text || '').join('') }] : []) || []
  if (items.length < 3) return null
  return <nav aria-label="Sommaire" className="contents"><p>Sur cette page</p><ol>{items.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.text}</a></li>)}</ol></nav>
}
