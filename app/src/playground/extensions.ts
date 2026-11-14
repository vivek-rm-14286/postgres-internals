// Registry of PGlite extensions a lesson may request. Each is loaded lazily, only when a playground needs it.
/* eslint-disable @typescript-eslint/no-explicit-any */
const loaders = {
  pageinspect: () => import('@electric-sql/pglite/contrib/pageinspect').then((m) => m.pageinspect),
  pg_visibility: () => import('@electric-sql/pglite/contrib/pg_visibility').then((m) => m.pg_visibility),
  pg_freespacemap: () => import('@electric-sql/pglite/contrib/pg_freespacemap').then((m) => m.pg_freespacemap),
  pg_buffercache: () => import('@electric-sql/pglite/contrib/pg_buffercache').then((m) => m.pg_buffercache),
  pg_walinspect: () => import('@electric-sql/pglite/contrib/pg_walinspect').then((m) => m.pg_walinspect),
  pg_stat_statements: () => import('@electric-sql/pglite/contrib/pg_stat_statements').then((m) => m.pg_stat_statements),
  pg_trgm: () => import('@electric-sql/pglite/contrib/pg_trgm').then((m) => m.pg_trgm),
  btree_gin: () => import('@electric-sql/pglite/contrib/btree_gin').then((m) => m.btree_gin),
  btree_gist: () => import('@electric-sql/pglite/contrib/btree_gist').then((m) => m.btree_gist),
  bloom: () => import('@electric-sql/pglite/contrib/bloom').then((m) => m.bloom),
  amcheck: () => import('@electric-sql/pglite/contrib/amcheck').then((m) => m.amcheck),
  hstore: () => import('@electric-sql/pglite/contrib/hstore').then((m) => m.hstore),
  ltree: () => import('@electric-sql/pglite/contrib/ltree').then((m) => m.ltree),
  citext: () => import('@electric-sql/pglite/contrib/citext').then((m) => m.citext),
  pgcrypto: () => import('@electric-sql/pglite/contrib/pgcrypto').then((m) => m.pgcrypto),
  tablefunc: () => import('@electric-sql/pglite/contrib/tablefunc').then((m) => m.tablefunc),
  pg_surgery: () => import('@electric-sql/pglite/contrib/pg_surgery').then((m) => m.pg_surgery),
  tsm_system_rows: () => import('@electric-sql/pglite/contrib/tsm_system_rows').then((m) => m.tsm_system_rows),
  uuid_ossp: () => import('@electric-sql/pglite/contrib/uuid_ossp').then((m) => m.uuid_ossp),
  vector: () => import('@electric-sql/pglite-pgvector').then((m) => m.vector),
} satisfies Record<string, () => Promise<any>>

export type ExtensionName = keyof typeof loaders
export const EXTENSION_NAMES = Object.keys(loaders) as ExtensionName[]

/** SQL name used in CREATE EXTENSION (differs from the JS key for uuid-ossp). */
export const sqlName = (e: ExtensionName) => (e === 'uuid_ossp' ? '"uuid-ossp"' : e)

export async function loadExtensions(names: ExtensionName[]): Promise<Record<string, any>> {
  const entries = await Promise.all(names.map(async (n) => [n, await loaders[n]()] as const))
  return Object.fromEntries(entries)
}
