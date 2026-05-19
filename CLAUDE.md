# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This is a personal learning/skills playground. Each top-level directory `NNN_<topic>/` (e.g., `120_sql_function_index/`, `128_nodejs_nats/`) is a **self-contained mini-project** demonstrating one technology or pattern. Folders are independent — no shared root build, no shared dependencies, no cross-folder imports.

When the user references work, treat the numbered folder as the project root. Do not assume tools or scripts in one folder apply to another.

## Conventions

- **Folder naming**: `NNN_<snake_case_topic>`. The number is a sequence ID, not a version. A `_v2` suffix marks a rewrite of an earlier folder with the same number (e.g., `130_leaflet_map` vs `130_leaflet_map_v2`).
- **`CHUAXONG` suffix** = Vietnamese "chưa xong" (not finished). Folders ending in `_CHUAXONG` are work-in-progress and may be incomplete or non-functional (currently: `124_teleport_CHUAXONG`, `131_sink_connector_CHUAXONG`). Don't treat these as reference examples.
- **Step-numbered files** (`01_*.sql`, `02_*.js`, etc.) are meant to be read/run in order — they teach a progression from basic to advanced.
- **Documentation is primarily in Vietnamese** (Markdown files, code comments, commit messages). When the user writes in Vietnamese, mirror that in your prose; code identifiers stay English. The user's working language is Vietnamese (see auto-memory `user_profile`).
- **Commit messages are intentionally minimal** (`.`, `a`, `...`) — don't model commit style on `git log`. When asked to commit, write a real descriptive message anyway.

## Running a project

There is **no repo-wide build, lint, or test command**. Always `cd` into the specific `NNN_*/` folder first, then use that project's own toolchain. Read its `README.md` (or `*.md` guide) before running anything — each folder documents its own entry points.

Common patterns by folder type:

| Project type | How to run | Examples |
|---|---|---|
| Node.js project with `package.json` | `npm install` then check `scripts` block — many use namespaced scripts like `npm run 01:pub`, `npm run docker:up` | `127_nodejs_revalidate_cache/`, `128_nodejs_nats/`, `121_sentry_tracing_performance/` |
| Go project with `go.mod` | `go mod tidy` then `go run .` with subcommands | `118_golang_cobra_cmd/`, `129_go_CGO_ENABLED/` |
| Astro project | `npm install` then `npm run dev` / `build` / `preview` | `118_astro_front_end/astro-demo/` |
| Static HTML/JS demos | Open `index.html` (or numbered `*.html`) in a browser — no build step | `125_offline_cache/`, `126_IndexedDB/`, `130_leaflet_map*/` |
| SQL tutorial | Run `.sql` files in order against MySQL 8.0.13+ | `120_sql_function_index/` |
| Docker-orchestrated stack | `docker-compose up -d` from the folder root, then follow the README's curl/CLI steps | `121_sentry_tracing_performance/`, `123_jenskins_cmd_schedules/`, `128_nodejs_nats/`, `131_sink_connector_CHUAXONG/` |
| Jenkins examples | Each subfolder has a `Jenkinsfile` — not runnable locally without Jenkins (use the `docker-compose.yml` at the folder root) | `123_jenskins_cmd_schedules/` |
| Pure markdown notes | No commands — read the `.md` files | `122_zincsearch/`, `132_p_npm/`, `124_teleport_CHUAXONG/` |

## Working on a folder

1. Open the folder's `README.md` (or main `.md` guide) first — it documents the entry points and any required services.
2. If `docker-compose.yml` exists, the project likely depends on backing services (Redis, Postgres, NATS, Kafka, Jenkins, etc.) — they must be running before scripts will work.
3. For Node.js folders, `node_modules` is gitignored only for `127_nodejs_revalidate_cache` and `128_nodejs_nats` per the root `.gitignore`. Other Node projects may have it committed — check before deleting.
4. Don't add lint/format/test infrastructure or refactor across folders unless the user asks. Each folder is intentionally minimal and standalone; adding tooling fights the purpose.
