# pg-internals MCP server

PostgreSQL 18 for AI agents: the 106 lessons (Fundamentals, Internals, Ecosystem) and 91 graded exercises from
[Postgres, Visualized](https://vivek-rm-14286.github.io/postgres-internals/), complete reference tables,
distilled docs notes, and a **live PostgreSQL 18 sandbox** (PGlite, in-memory) to verify behaviour instead of guessing.

## Tools

| Tool | What it does |
|---|---|
| `search` | Ranked search over lessons, graded exercises, reference rows and docs notes. Returns ids. |
| `read` | Full text of a search hit: a lesson, an exercise (task, schema, reference solution, dataset setup), a reference row or a note. |
| `list_lessons` / `get_lesson` | The curriculum, and one lesson as markdown: TL;DR, mechanism, runnable SQL with "look for" notes, a production scenario, pitfalls (symptom / why / fix), key pointers. |
| `lookup_reference` | Filter the reference tables: 410 GUCs, 64 catalogs, 37 system views, 43 stats views, 280 wait events, 12 lock modes, 183 SQL commands, 100 data types, 6 index AMs, 51 extensions, 35 programs, 232 admin functions, 263 SQLSTATEs, limits, glossary, acronyms. |
| `run_sql` | Run SQL on a named sandbox session. Statements run one by one like psql. Returns tables, EXPLAIN plans, NOTICE/INFO output and SQLSTATE errors. 33 extensions available (plus PostGIS 3.6 with `with_postgis: true`), including `pageinspect`, `pg_visibility`, `pg_walinspect`, `pg_stat_statements`, `pg_trgm` and `vector`. |
| `reset_sandbox` | Throw a session away. |

Each session runs in its own worker thread: a runaway query hits `timeout_ms` (default 30 s), and the session is reset
without taking the server down. Up to 8 sessions are kept; the least recently used one is dropped first.
Sandbox limits: one backend per session (no concurrent transactions inside one sandbox), no replication, no file access.

## Install (one command)

```bash
npx -y github:vivek-rm-14286/postgres-internals
```

It lists the AI tools found on your machine, lets you tick the ones you want (↑/↓, space, enter), installs the server to
`~/.local/share/pg-internals-mcp` (Windows: `%LOCALAPPDATA%\pg-internals-mcp`), checks that it starts, and registers it.
Requires Node.js 20.11+.

| Command | What it does |
|---|---|
| `npx -y github:vivek-rm-14286/postgres-internals` | interactive menu: install / update, or uninstall |
| `… install --all` | every detected tool, no prompts (works in scripts and CI) |
| `… install --clients cursor,codex` | specific tools |
| `… status` | server state and which tools have it |
| `… uninstall` | pick tools to remove it from; deletes the server files once no tool uses them |
| `… uninstall --all --yes` | remove everywhere, no prompts |

Supported tools and the ids for `--clients`: `claude-code` (Claude Code, via `claude mcp`), `claude-desktop`, `cursor`,
`vscode` and `vscode-insiders` (GitHub Copilot agent mode), `copilot-cli` (GitHub Copilot CLI), `opencode`, `pi`, `codex`
(OpenAI Codex CLI, IDE extension and app), `gemini` (Gemini CLI), `antigravity`, `windsurf` (Windsurf / Devin Desktop), `zed`,
`cline`, `kiro`, `goose`.

**Safe edits.** Config files are edited in place: comments, formatting and your other servers are kept. Uninstall restores
each file byte-for-byte when you have not changed it since; otherwise it removes only the pg-internals entry. Tools are
pointed at an absolute `node` path, so apps launched from the Dock or Start menu find it even when node comes from nvm or
Homebrew. Re-running `install` updates the server in place.

### Manual setup

```bash
git clone https://github.com/vivek-rm-14286/postgres-internals
cd postgres-internals/mcp && npm install && npm test
```

Then add `node /absolute/path/to/postgres-internals/mcp/server.mjs` as a stdio server in your client. Inside the cloned
repo, Claude Code picks it up automatically from `.mcp.json`.

## Updating the data

`data/` is generated from the website's lessons and reference tables:

```bash
cd ../app && npm install && cd ../mcp && npm run build-data
```
