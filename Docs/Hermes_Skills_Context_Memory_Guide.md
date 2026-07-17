# Hermes Agent — Skills, Project Context & Memory: The Ultimate Guide

> The three systems that make Hermes SMARTER over time. Skills = reusable workflows. Project context = per-project rules. Memory = facts that survive across sessions. Master these and Hermes stops being a tool and starts being YOUR agent.

> **Official reference:** This guide's Skills commands and formats are checked against the [Hermes Skills System documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills). Refer to it for the current catalog and release-specific behavior.

---

## PART 1: SKILLS SYSTEM

### 1.1 What is a skill?

A skill is a markdown file (SKILL.md) that teaches Hermes HOW to do something. It's reusable knowledge — write it once, load it forever.

**Public example:**
```
deploy-runbook   → guides a team through a repeatable deployment and rollback process
```

Every time you solve a tricky problem, discover a workflow, or get corrected by Hermes on something environment-specific — that's a candidate for a skill.

**Mental model:** A skill is a task-specific playbook. Instead of re-explaining a repeatable process, keep its steps, checks, and known pitfalls together so Hermes can load it only when it is relevant.

---

### 1.2 Where skills live

```
~/.hermes/skills/                          # primary skill directory
├── devops/
│   └── deploy-k8s/
│       └── SKILL.md                       # required main instructions
└── mlops/
    └── axolotl/
        ├── SKILL.md
        ├── references/                    # optional supporting material
        ├── templates/
        ├── scripts/
        ├── examples/
        └── assets/
```

`~/.hermes/skills/` is Hermes' primary source of truth. You can also configure external skill directories; when names collide, the local skill takes precedence.

---

### 1.3 CLI commands — finding and installing skills

```bash
# Browse the skills catalog (interactive)
hermes skills browse

# Search all available sources
hermes skills search kubernetes

# Preview before installing
hermes skills inspect openai/skills/k8s

# Install with Hermes' security scan
hermes skills install openai/skills/k8s

# Browse or install official optional skills
hermes skills browse --source official
hermes skills install official/security/1password

# Install a SKILL.md from a direct URL
hermes skills install https://sharethis.chat/SKILL.md

# List, check, and update Hub-installed skills
hermes skills list --source hub
hermes skills check
hermes skills update

# Re-scan or remove a Hub skill
hermes skills audit
hermes skills uninstall k8s

# Add a GitHub repo as a skill source (community skills)
hermes skills tap add myorg/skills-repo
```

---

### 1.4 Loading skills into your session

Every installed skill is available as a slash command. For example:
```
/plan design a rollout for migrating our auth provider
/excalidraw
```

You can load up to five skills at once by placing their slash commands at the start of a message:
```
/github-pr-workflow /test-driven-development fix issue #123 and open a PR
```

Use `/skills` for Skills Hub management in chat, for example `/skills list` or `/skills search react --source skills-sh`.

---

### 1.5 Creating your own skills

There are two ways: agent-created (Hermes writes it) and human-created (you write it).

#### Agent-created (easiest)

Use `/learn` to turn a source or a workflow into a reusable skill:
```
/learn how I just deployed the staging server
```

You can also point `/learn` at local documentation, an online documentation page, pasted notes, or a procedure you describe. Hermes gathers the supplied material and authors a standard `SKILL.md`.

#### Human-created (more control)

Create the file yourself. Minimum structure:

```markdown
---
name: my-skill-name
description: Brief description of what this skill does
version: 1.0.0
metadata:
  hermes:
    tags: [deployment, runbook]
---

# My Skill

## When to Use
- State the situations that should trigger this skill.

## Procedure
1. Record the first safe, repeatable step.
2. Record the next step and its expected outcome.

## Pitfalls
- Name known failure modes and how to recover.

## Verification
- Explain how to confirm the workflow succeeded.
```

Save it anywhere under `~/.hermes/skills/<skill-name>/SKILL.md`.

---

### 1.6 skill_manage tool — what Hermes uses

Hermes has a built-in `skill_manage` tool. You don't call this directly — Hermes does. But understanding it helps you know what's possible:

| Action | What it does |
|--------|-------------|
| `create` | Create a new SKILL.md |
| `patch` | Targeted edit (find + replace) |
| `edit` | Full rewrite of SKILL.md |
| `delete` | Remove a skill |
| `write_file` | Add a supporting file (reference, template, script) |
| `remove_file` | Remove a supporting file |

Skills can have sub-files in `references/`, `templates/`, `scripts/`, and `assets/`.

---

### 1.7 When to create a skill vs when not to

**Create a skill when:**
- You solved a complex problem (5+ steps) you'll face again
- You hit an error, figured out the fix, and want to remember it
- You discovered a platform-specific quirk that differs from your usual environment
- You have a tool with specific flags/env vars you always forget
- Hermes corrected you on something environment-specific

**Don't create a skill when:**
- It's a one-off task you'll never repeat
- It's a single simple command
- It's already covered by an existing skill (search first!)
- It's better as a memory entry (preferences, names, environment facts)

---

### 1.8 Skills workflow cheat sheet

```
GOAL                                    COMMAND
──────────────────────────────────────────────────────────────────
Find a skill                            hermes skills search <query>
Preview a skill                         hermes skills inspect <identifier>
Install an official skill               hermes skills install official/<category>/<name>
Install from GitHub                     hermes skills install <owner>/<repo>/<path>
List Hub-installed skills               hermes skills list --source hub
Invoke an installed skill               /skill-name <request>
Create a source-backed skill            /learn <source or workflow>
Check for updates                       hermes skills check
Update installed Hub skills             hermes skills update
Review installed Hub skills             hermes skills audit
```

---

## PART 2: PROJECT CONTEXT FILES

### 2.1 What are project context files?

Files that tell Hermes "when you're in THIS project, follow THESE rules." Hermes auto-detects them and injects them into the system prompt at session start.

**Mental model:** It's like leaving a sticky note for Hermes on your project folder. Every time Hermes works in that folder (or any subfolder), it reads the note first.

---

### 2.2 The five file types (and discovery rules)

| File | Discovery | Use for |
|------|-----------|---------|
| `.hermes.md` / `HERMES.md` | Walks up from cwd to git root | Hermes-specific project rules |
| `AGENTS.md` / `agents.md` | **CWD ONLY** — no parent walk | Portable rules (works in Claude Code, Codex, etc.) |
| `CLAUDE.md` / `claude.md` | CWD ONLY | Same as AGENTS.md, Claude-flavored |
| `.cursorrules` / `.cursor/rules/*.mdc` | CWD ONLY | Migrating from Cursor IDE |
| `SOUL.md` | `$HERMES_HOME` (global) | Agent identity, NOT project rules |

**First match wins.** Hermes loads only ONE project context source per session, in the priority order above.

---

### 2.3 Which one should you use?

```
Scenario                                    Use
─────────────────────────────────────────────────────────
One project, Hermes-only                    .hermes.md
Multiple projects, want rules to inherit    .hermes.md at repo root
Same rules for Hermes + Claude Code + Codex AGENTS.md
Coming from Cursor IDE                      Keep .cursorrules
Global identity (how Hermes "thinks")       SOUL.md in ~/.hermes/
```

**Rule of thumb for a student:** Start with `.hermes.md` at your repo root. It's the most flexible — rules auto-apply to any subfolder.

---

### 2.4 .hermes.md — the hierarchical one

`.hermes.md` walks UP from your current directory to the git root, loading the FIRST one it finds. This means:

```
~/Coding/MyProject/              ← git root
├── .hermes.md                   ← "Always use uv, not pip"
├── backend/
│   └── .hermes.md               ← "Backend uses FastAPI patterns, SQLAlchemy"
│   └── src/
│       └── (no .hermes.md)      ← inherits backend/.hermes.md
└── frontend/
    └── (no .hermes.md)          ← inherits root .hermes.md
```

When Hermes runs in `~/Coding/MyProject/backend/src/`, it loads `backend/.hermes.md` (the closest one walking up). It does NOT also load the root one.

**To make root rules apply everywhere**, put them in the root `.hermes.md` and don't create subdirectory overrides unless you need different rules.

---

### 2.5 AGENTS.md — the portable one

`AGENTS.md` is loaded ONLY from the exact current working directory. No parent walk. This makes it predictable and portable:

```bash
cd ~/Coding/MyProject/frontend
hermes
# Hermes looks for ~/Coding/MyProject/frontend/AGENTS.md ONLY
# Does NOT look at ~/Coding/MyProject/AGENTS.md
```

Use AGENTS.md when the SAME rules should work for Hermes, Claude Code, Codex CLI, and any other AI coding agent.

---

### 2.6 Writing a good project context file

```markdown
# MyProject

## Build
- Use `uv run` for Python, NEVER `pip install`
- Run `make test` before declaring anything done
- Docker: `docker compose up --build`

## Style
- Prefer `pathlib.Path` over `os.path`
- No `print()` in production — use the `logger` module
- Type hints on ALL function signatures

## Testing
- pytest with `-xvs` flags
- Tests go in `tests/` mirroring `src/` structure
- Run `uv run pytest` from repo root

## Environment
- Python 3.12, Kali Linux
- PostgreSQL 16 in Docker
- API keys in `.env`, NEVER hardcoded

## Conventions
- Branch naming: `feature/description`, `fix/description`
- Commit messages: present tense, descriptive
- PRs need one approval before merge
```

**Rules for writing these:**
- Be specific. "Use uv" is better than "Use the right package manager"
- Include commands Hermes should run (it prevents guesswork)
- Mention environment quirks (Kali, Docker, WSL)
- Keep it under 20,000 characters (head+tail truncation kicks in after that)
- Use markdown headers for structure — Hermes reads them as semantic sections

---

### 2.7 Size limits and truncation

Each context file is capped at **20,000 characters**. Files longer than that get **head + tail** truncation — the middle is dropped with a `[...truncated...]` marker.

For large project rules, split into multiple skills instead of cramming one file.

---

### 2.8 Security scanning

All context files pass through a threat-pattern scanner before reaching the system prompt. If someone puts prompt injection or promptware in your AGENTS.md (like a malicious dependency), the scanner blocks the malicious content — not the whole file. The rest still loads.

You'll see `[BLOCKED: ...]` placeholders where content was scrubbed.

---

### 2.9 Disabling project context

```bash
hermes --ignore-rules
```

This skips ALL project context files AND SOUL.md, user config, plugins, and MCP servers. Use it to isolate whether a problem is your setup or Hermes itself.

---

### 2.10 Project context quick reference

```
GOAL                                    WHAT TO DO
──────────────────────────────────────────────────────────────────
Set rules for one project               Create .hermes.md at git root
Rules for Hermes + other AI agents      Create AGENTS.md in cwd
Override rules for a subdirectory       Create .hermes.md in that subdir
Global Hermes identity                  Create SOUL.md in ~/.hermes/
Disable all context for debugging       hermes --ignore-rules
Check if rules are loading              Ask Hermes "What project rules are you following?"
```

---

## PART 3: MEMORY SYSTEM

### 3.1 What is memory?

Memory is persistent storage that survives across sessions. Two targets:

| Target | What it stores | Example |
|--------|---------------|---------|
| `user` | Who the user IS | Name, timezone, skill level, goals, communication preferences |
| `memory` | What the agent KNOWS | Environment details, tool quirks, project conventions, lessons learned |

**Mental model:** Memory is Hermes's long-term notebook. Use it for durable, compact facts—not private credentials, full project internals, or temporary task notes.

---

### 3.2 A public-safe memory rule

Do not publish a snapshot of a real person's memory, profile, machine configuration, local paths, or project secrets. Documentation should demonstrate the *shape* of a useful memory entry without exposing anyone's data:

```
Good: "Project uses pytest for automated tests."
Good: "User prefers concise status updates."
Avoid: API keys, access tokens, home-directory paths, contact details, or temporary task progress.
```

This keeps a guide reusable for every reader while modeling good operational hygiene.

---

### 3.3 How memory works (the memory tool)

Hermes uses a `memory` tool to read and write. You don't call this directly — Hermes does it automatically. But understanding it helps you know what to expect:

**Reading:** Memory is injected into every turn automatically. Hermes sees your profile + its notes before responding.

**Writing:** Hermes saves facts when it learns something durable. It should save:
- User preferences and corrections ("I prefer X over Y")
- Environment details that won't change soon
- Tool quirks and workarounds
- Project conventions

**NOT saved to memory:**
- Task progress ("working on feature X")
- Completed work ("finished PR #42")
- Temporary TODO lists
- File paths that will change
- Anything stale in a week

**The golden rule:** If a fact will be stale in a week, it doesn't belong in memory.

---

### 3.4 Memory operations (what Hermes can do)

| Operation | What it does |
|-----------|-------------|
| `add` | Save a new fact |
| `replace` | Update an existing fact (find by old_text + replace with new) |
| `remove` | Delete an entry |
| `operations` (batch) | Multiple add/replace/remove in ONE atomic call |

The batch `operations` is important: memory has a character budget. If memory is full, a single `add` fails. But a batch call that removes old entries AND adds new ones in one shot can succeed even when an add alone would overflow. Hermes uses this automatically.

---

### 3.5 Memory CLI commands

```bash
# Check memory system status
hermes memory status

# Configure memory provider
hermes memory setup

# Disable memory entirely
hermes memory off
```

---

### 3.6 Memory providers (backends)

By default, memory is stored in the session database (SQLite). You can switch to external providers:

| Provider | What it is |
|----------|-----------|
| Built-in | Default, stores in state.db |
| Honcho | External memory service |
| Mem0 | AI-native memory platform |

For a student, stick with built-in. No setup needed.

---

### 3.7 Character budget

- **User profile:** ~1,375 characters max
- **Agent memory:** ~2,200 characters max

When full, entries compete for space. Batch operations let Hermes consolidate — remove low-value old entries and add high-value new ones together.

You can see your usage at the top of every session:
```
MEMORY (your personal notes) [46% — 1,028/2,200 chars]
USER PROFILE (who the user is) [94% — 1,296/1,375 chars]
```

Your user profile is nearly full (94%). That's fine — it rarely changes. But if you want to add something, old entries need trimming.

---

### 3.8 What makes a good memory entry

**Good (high signal, stays true):**
```
"Project uses pytest with xdist for parallel testing"
"User prefers concise responses without fluff"
"Kali VM has 8GB RAM — avoid memory-heavy parallel builds"
```

**Bad (will be stale in a week):**
```
"Currently working on feature X"
"Fixed bug #42 in auth module"
"Yesterday we discussed Y"
```

**Also bad (too verbose):**
```
"When working on the release service, use this specific environment, these package commands, these endpoints, and this rollback procedure..."
```

That should be a SKILL, not a memory entry. Memory is for quick facts; skills are for procedures.

---

### 3.9 Memory vs Skills vs Project Context — when to use which

| System | What it's for | Example |
|--------|--------------|---------|
| **Memory** | Quick facts that survive all sessions | "User is in IST timezone", "Use uv not pip" |
| **Skills** | Reusable procedures and workflows | "How to deploy this app to Docker", "How to prepare release notes" |
| **Project Context** | Per-project rules, loaded automatically | "This repo uses FastAPI, pytest, and SQLAlchemy" |

**Decision flowchart:**
```
Is it a procedure (multiple steps)?     → Skill
Is it a per-project rule?               → Project context file (.hermes.md)
Is it a durable fact about you or env?  → Memory
Is it temporary / task progress?        → Don't save — use session_search to find it later
```

---

### 3.10 session_search — finding past conversations

Different from memory. `session_search` searches your actual conversation history (the session database with FTS5 full-text search). Hermes uses this to recall past discussions.

```bash
# Hermes can search your past sessions for context
session_search(query="release checklist")
session_search(query="Docker deployment notes")
```

This is how Hermes finds "what did we discuss about X last week" without you repeating yourself.

---

## PART 4: PUTTING IT ALL TOGETHER

### Public-safe example: a release readiness assistant

This pattern combines Hermes' documented context files with a portable skill—without copying a real developer's environment into public documentation.

**Project context (`AGENTS.md`):**
```markdown
# Release service

## Architecture
- API code is in `backend/`; the web app is in `frontend/`.

## Release checks
- Run the project's documented test suite before a release.
- Record the release version and rollback owner in the change summary.
- Never place credentials or production tokens in this file.
```

Hermes treats `AGENTS.md` as project context: it loads the file in the working directory at session start and can discover context files in subdirectories as it works there. Keep context focused on structure, conventions, and stable guardrails.

**Skill (`release-readiness`):**
```markdown
---
name: release-readiness
description: Create a repeatable release-readiness brief
version: 1.0.0
---

# Release Readiness

## When to Use
- Before a planned release or rollback review.

## Procedure
1. Gather the approved change summary and test evidence.
2. Identify owners, dependencies, and rollback criteria.
3. Produce a concise go/no-go brief with open risks.

## Verification
- Confirm every item has an owner or is explicitly accepted as a risk.
```

**Memory:** Keep only durable preferences that improve future collaboration, such as “release summaries should include a rollback owner.” Do not store credentials, internal endpoints, or a user's personal data.

**Why this is useful:** Context files explain the repository; a skill captures a repeatable procedure; memory preserves a small, long-lived preference. The separation keeps instructions easy to update and safe to share.

> **Unique rule of thumb — the portability test:** If you could remove names, paths, tokens, and company-specific facts and the workflow still helps another team, it belongs in a public skill. Otherwise, keep it private to the project context or do not store it at all.

---

### Setting up a new project from scratch

```bash
# 1. Create the context file
cd ~/Coding/NewProject
cat > .hermes.md << 'EOF'
# NewProject

## Build
- Python 3.12
- Use `uv sync` for deps
- Run: `uv run python main.py`

## Tests
- `uv run pytest -xvs`
EOF

# 2. Start Hermes — it auto-loads .hermes.md
hermes

# 3. In the session, tell Hermes about the project
"This is a new project for X. Remember: use uv, pytest, and Python 3.12."

# Hermes saves relevant facts to memory automatically
# After complex work: "Save this workflow as a skill called 'newproject-deploy'"
```

---

## QUICK REFERENCE CARDS

### Skills
```
Browse official skills  hermes skills browse --source official
Find a skill            hermes skills search <query>
Preview a skill         hermes skills inspect <identifier>
Install a skill         hermes skills install <identifier>
List Hub skills         hermes skills list --source hub
Load in chat            /skill-name <request>
Create from sources     /learn <source or workflow>
Check for updates       hermes skills check
Update Hub skills       hermes skills update
Audit Hub skills        hermes skills audit
```

### Project Context
```
Create rules            touch .hermes.md (at repo root)
Portable rules          touch AGENTS.md (cwd only)
Global identity         touch ~/.hermes/SOUL.md
Disable all rules       hermes --ignore-rules
```

### Memory
```
Check status            hermes memory status
Configure               hermes memory setup
Disable                 hermes memory off
Find past discussions   session_search(query="...")
```

---

That's the full picture. Skills make Hermes capable. Project context makes Hermes project-aware. Memory makes Hermes remember. Together they turn Hermes from a chatbot into YOUR agent that gets better every session.
