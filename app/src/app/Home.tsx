import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Cpu, Database, FlaskConical, Layers, MousePointerClick } from 'lucide-react'
import { TRACKS, modulesIn, lessonsIn, lessonPath, LESSONS } from '../lessons'
import { useProgress } from './progress'

export function Home() {
  const done = useProgress()
  useEffect(() => { document.title = 'Postgres, Visualized: learn PostgreSQL interactively' }, [])
  const first = LESSONS[0]
  const resume = LESSONS.find((l) => !done.has(l.slug)) ?? first
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-8">
      <section className="pt-12 pb-10">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-sm text-accent">PostgreSQL 18 · from your first SELECT to internals and beyond</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Learn PostgreSQL, from first query to internals.
        </motion.h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          An interactive textbook in three tracks: <b className="text-ink">Fundamentals</b>, <b className="text-ink">Internals</b> and the <b className="text-ink">Ecosystem</b>{' '}
          (pgvector, TimescaleDB, distributed PostgreSQL). Every lesson pairs a <b className="text-ink">step-through visual</b> with a <b className="text-ink">real Postgres running in your browser</b>,
          and the Cookbook has graded exercises from beginner to expert.
        </p>
        {resume && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={lessonPath(resume)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90">
              {done.size ? 'Continue' : 'Start learning'} <ArrowRight className="size-4" />
            </Link>
            <Link to="/cookbook" className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-semibold hover:border-accent"><FlaskConical className="size-4" /> Practise in the Cookbook</Link>
            <Link to="/reference" className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 font-semibold hover:border-accent">Browse the reference</Link>
          </div>
        )}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            [MousePointerClick, 'Visual first', 'Pages, tuples, trees and WAL records animate step by step. Scrub back and forth.'],
            [Database, 'Real Postgres, no server', 'PostgreSQL 18 runs right in your browser. Try pageinspect, EXPLAIN (ANALYZE, BUFFERS), pg_locks.'],
            [Layers, 'Same six beats', 'TL;DR, visual, playground, production story, pitfalls, cheat sheet. Every lesson.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Cpu
            return (
              <div key={t as string} className="rounded-xl border border-line bg-surface p-4">
                <I className="size-5 text-accent" />
                <p className="mt-2 font-semibold">{t as string}</p>
                <p className="mt-1 text-sm text-muted">{d as string}</p>
              </div>
            )
          })}
        </div>
      </section>

      {TRACKS.map((t) => (
        <section key={t.id} aria-label={t.title} className="mt-10 grid gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
            <p className="mt-1 text-muted">{t.blurb}</p>
          </div>
          {modulesIn(t.id).map((m, i) => {
            const ls = lessonsIn(m.id)
            const n = ls.filter((l) => done.has(l.slug)).length
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono text-sm font-bold text-accent">{m.code}</span>
                  <h3 className="text-xl font-bold tracking-tight">{m.title}</h3>
                  <span className="ml-auto font-mono text-xs text-muted">{n}/{ls.length} done</span>
                </div>
                <p className="mt-1 text-sm text-muted">{m.blurb}</p>
                <ol className="mt-3 flex flex-wrap gap-2">
                  {ls.map((l) => (
                    <li key={l.slug}>
                      <Link to={lessonPath(l)} className={`inline-block rounded-full border px-3 py-1 text-[13px] hover:border-accent hover:text-accent ${done.has(l.slug) ? 'border-ok/50 bg-ok/10' : 'border-line'}`}>
                        {l.order}. {l.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
