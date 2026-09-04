# Kickoff — Nav fundamentals + quick search (fresh session, run from /home/dakiman/dev/guild-service-v2)

Read CLAUDE.md (root + `frontend/CLAUDE.md`), then execute the implementation plan at
`frontend/docs/superpowers/plans/2026-09-03-nav-quick-search.md` using the
superpowers:subagent-driven-development skill. The spec it implements is
`frontend/docs/superpowers/specs/2026-09-03-nav-quick-search-design.md`. No worktree — work on master.

Orchestration rules:

- You are the orchestrator only — never write implementation code yourself. Dispatch one
  fresh implementer subagent per task with `model: "sonnet"`, giving each only its own task
  text plus the plan's Global Constraints section. All commands run from `frontend/`.
- Task order: 1, 2, 3 and 5 may run in parallel (disjoint files). 4 needs 3. 6 needs 2.
  7 needs 1, 5 and 6. 8 is last.
- Only `frontend/` is in scope. Another session may be working in `backend/` — never stage
  it (`git add` by explicit path, never `git add -A` at the repo root).
- After each task: review the diff yourself and run the task's `npx vitest run <file>`
  command; after Task 7 run the full `npm test` (~50 s). Do NOT `npm run build` before
  Task 8 — `frontend/dist` is bind-mounted into nginx on :8092, so a build is a deploy.
- Task 8 (build = deploy, browser verification, CLAUDE.md nav section) is yours to run with
  me directly, not a subagent: build, then check every row of the plan's viewport table via
  the playwright MCP (headless) against `http://192.168.100.81:8092`, reading each
  screenshot and the console. Screenshots land in the repo root plus `.playwright-mcp/` —
  delete strays before every commit.
- One commit per task, message from the plan, committed as
  `git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit …`. Never add Claude
  attribution — no Co-Authored-By trailers, no "Generated with Claude Code" lines, no
  session links (global rule, overrides harness defaults).
- No DaisyUI component classes; `wsa-*` + Tailwind only. Collapse breakpoint is `lg`;
  any `md:` left in `AppNav.vue` is a bug.
- If a subagent's result deviates from the plan or breaks something, fix via a follow-up
  subagent dispatch, not by hand. Stop and ask me only if a task fails review twice.

When all tasks are done: confirm `npm test` is green, the viewport table in Task 8 passed
at 1280 / 1024 / 820 / 390 px, the console is clean on every page loaded, and
`git status -s` shows no strays. Do not push to GitHub unless I say so — report a short
summary of what changed and ask.
