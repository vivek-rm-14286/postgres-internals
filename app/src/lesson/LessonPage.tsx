import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Building2, Check, CircleAlert, Lightbulb, Sparkles, SquareTerminal, Zap } from 'lucide-react'
import type { Lesson } from './types'
import { Md } from './Md'
import { VizFrame } from './VizFrame'
import { Playground } from '../playground/Playground'
import { lessonPath, neighbours } from '../lessons'
import { moduleById } from '../lessons/modules'
import { setDone, useProgress } from '../app/progress'

export function LessonPage({ lesson }: { lesson: Lesson }) {
  const mod = moduleById(lesson.module)
  const { prev, next } = neighbours(lesson.slug)
  const done = useProgress().has(lesson.slug)
  const V = lesson.visualizer.Component

  useEffect(() => { document.title = `${lesson.title} · Postgres, Visualized` }, [lesson])

  return (
    <article className="mx-auto w-full min-w-0 max-w-4xl px-4 pb-24 sm:px-8" data-testid="lesson" data-slug={lesson.slug}>
      <header className="pt-8 pb-6">
        <p className="font-mono text-xs text-accent">{mod.code} · {mod.title} · Lesson {lesson.order}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>
      </header>

      {/* 1. TL;DR */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-l-4 border-accent bg-accent-soft px-5 py-4" aria-label="TL;DR">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider text-accent uppercase"><Zap className="size-3.5" /> TL;DR</p>
        <p className="text-[17px] leading-relaxed"><Md>{lesson.tldr[0]}</Md> <Md>{lesson.tldr[1]}</Md></p>
      </motion.section>

      {/* 2. Visualizer */}
      <Section n={2} icon={<Sparkles className="size-4" />} title={lesson.visualizer.title} id="visualizer">
        <p className="-mt-2 mb-4 text-sm text-muted"><Md>{lesson.visualizer.caption}</Md></p>
        <VizFrame Component={V} title={lesson.visualizer.title} />
      </Section>

      {/* 3. Playground */}
      <Section n={3} icon={<SquareTerminal className="size-4" />} title="Live playground" id="playground">
        <p className="-mt-2 mb-4 text-sm text-muted">A real PostgreSQL 18 runs in this tab, pre-loaded with the lesson schema. Nothing leaves your browser.</p>
        <Playground setup={lesson.playground.setup} presets={lesson.playground.presets} extensions={lesson.playground.extensions} config={lesson.playground.config} />
      </Section>

      {/* 4. Production example */}
      <Section n={4} icon={<Building2 className="size-4" />} title="In production" id="production">
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="border-b border-line bg-surface-2 px-5 py-3"><p className="font-semibold"><Md>{lesson.production.title}</Md></p><p className="mt-0.5 text-sm text-muted"><Md>{lesson.production.context}</Md></p></div>
          <dl className="grid gap-4 px-5 py-4 text-[15px] leading-relaxed">
            <div><dt className="text-xs font-bold tracking-wider text-dead uppercase">Problem</dt><dd className="mt-1"><Md>{lesson.production.problem}</Md></dd></div>
            <div><dt className="text-xs font-bold tracking-wider text-ok uppercase">Solution</dt><dd className="mt-1"><Md>{lesson.production.solution}</Md></dd></div>
            {lesson.production.sql && <div><dt className="sr-only">SQL</dt><dd><pre className="overflow-x-auto rounded-lg bg-code p-3 text-[12.5px] leading-relaxed" tabIndex={0}>{lesson.production.sql.trim()}</pre></dd></div>}
            <div><dt className="text-xs font-bold tracking-wider text-accent uppercase">Outcome</dt><dd className="mt-1"><Md>{lesson.production.outcome}</Md></dd></div>
          </dl>
        </div>
      </Section>

      {/* 5. Pitfalls */}
      <Section n={5} icon={<CircleAlert className="size-4" />} title="Common pitfalls" id="pitfalls">
        <div className="grid gap-3">
          {lesson.pitfalls.map((p) => (
            <div key={p.title} className="rounded-xl border border-dead/40 bg-dead/5 px-5 py-4" role="note">
              <p className="flex items-center gap-2 font-semibold text-dead"><CircleAlert className="size-4 shrink-0" /><Md>{p.title}</Md></p>
              <dl className="mt-2 grid gap-1.5 text-[14.5px] leading-relaxed">
                <div><dt className="inline font-semibold">Symptom: </dt><dd className="inline"><Md>{p.symptom}</Md></dd></div>
                <div><dt className="inline font-semibold">Why: </dt><dd className="inline"><Md>{p.cause}</Md></dd></div>
                <div><dt className="inline font-semibold text-ok">Fix: </dt><dd className="inline"><Md>{p.fix}</Md></dd></div>
              </dl>
              {p.sql && <pre className="mt-2 overflow-x-auto rounded-lg bg-code p-3 text-[12.5px]">{p.sql.trim()}</pre>}
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Key pointers */}
      <Section n={6} icon={<Lightbulb className="size-4" />} title="Key pointers to remember" id="pointers">
        <ul className="grid gap-2 rounded-xl border border-line bg-surface px-5 py-4">
          {lesson.pointers.map((p) => (
            <li key={p} className="flex gap-2.5 text-[15px] leading-relaxed"><Check className="mt-1 size-4 shrink-0 text-ok" /><span><Md>{p}</Md></span></li>
          ))}
        </ul>
      </Section>

      <footer className="mt-10 grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setDone(lesson.slug, !done)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${done ? 'bg-ok/15 text-ok' : 'bg-accent text-on-accent hover:opacity-90'}`}>
            <Check className="size-4" /> {done ? 'Completed' : 'Mark lesson complete'}
          </button>
        </div>
        <nav className="grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
          {prev ? <NavCard to={lessonPath(prev)} dir="prev" title={prev.title} /> : <span />}
          {next && <NavCard to={lessonPath(next)} dir="next" title={next.title} />}
        </nav>
      </footer>
    </article>
  )
}

function Section({ n, icon, title, id, children }: { n: number; icon: ReactNode; title: string; id: string; children: ReactNode }) {
  return (
    <section className="mt-12 scroll-mt-20" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        <span className="font-mono text-sm text-muted">{n}.</span> <Md>{title}</Md>
      </h2>
      {children}
    </section>
  )
}

function NavCard({ to, dir, title }: { to: string; dir: 'prev' | 'next'; title: string }) {
  return (
    <Link to={to} className={`group rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent ${dir === 'next' ? 'text-right sm:col-start-2' : ''}`}>
      <span className="flex items-center gap-1 text-xs text-muted" style={{ justifyContent: dir === 'next' ? 'flex-end' : 'flex-start' }}>
        {dir === 'prev' ? <><ArrowLeft className="size-3" /> Previous</> : <>Next <ArrowRight className="size-3" /></>}
      </span>
      <span className="font-semibold group-hover:text-accent">{title}</span>
    </Link>
  )
}
