import { StrictMode, Suspense, lazy, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import { Layout } from './app/Layout'
import { Home } from './app/Home'
import { lessonBySlug, loadLesson, type LessonMeta } from './lessons'
const Cookbook = lazy(() => import('./cookbook/Cookbook').then((m) => ({ default: m.Cookbook })))
const Reference = lazy(() => import('./reference/Reference').then((m) => ({ default: m.Reference })))

const lessonComponents = new Map<string, ComponentType>()
function lessonComponent(meta: LessonMeta) {
  let C = lessonComponents.get(meta.slug)
  if (!C) {
    C = lazy(() => Promise.all([loadLesson(meta), import('./lesson/LessonPage')]).then(([lesson, { LessonPage }]) => ({ default: () => <LessonPage key={lesson.slug} lesson={lesson} /> })))
    lessonComponents.set(meta.slug, C)
  }
  return C
}

function LessonRoute() {
  const { slug = '' } = useParams()
  const meta = lessonBySlug(slug)
  if (!meta) return <Navigate to="/" replace />
  const C = lessonComponent(meta)
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 pt-10 sm:px-8"><p className="font-mono text-xs text-accent">Loading lesson…</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{meta.title}</h1></div>}>
      <C />
    </Suspense>
  )
}

// Reuse the root if this module is re-executed (Vite HMR), instead of calling createRoot twice on one container.
const container = document.getElementById('root')! as HTMLElement & { __root?: ReturnType<typeof createRoot> }
container.__root ??= createRoot(container)
container.__root.render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cookbook/*" element={<Suspense fallback={<p className="px-8 pt-10 text-sm text-muted">Loading cookbook…</p>}><Cookbook /></Suspense>} />
            <Route path="/reference/*" element={<Suspense fallback={<p className="px-8 pt-10 text-sm text-muted">Loading reference…</p>}><Reference /></Suspense>} />
            <Route path="/:module/:slug" element={<LessonRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
)
