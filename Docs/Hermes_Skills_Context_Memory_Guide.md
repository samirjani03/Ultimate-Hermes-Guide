# Hermes Agent — Skills, Project Context & Memory: The Ultimate Guide

> The three systems that make Hermes SMARTER over time. Skills = reusable workflows. Project context = per-project rules. Memory = facts that survive across sessions. Master these and Hermes stops being a tool and starts being YOUR agent.

---

## PART 1: SKILLS SYSTEM

### 1.1 What is a skill?

A skill is a markdown file (SKILL.md) that teaches Hermes HOW to do something. It's reusable knowledge — write it once, load it forever.

**Real example from your own setup:**
```
traceix-api-integration   → teaches Hermes how to use the Traceix malware analysis API
hermes-agent              → teaches Hermes how to configure and extend itself
```

Every time you solve a tricky problem, discover a workflow, or get corrected by Hermes on something environment-specific — that's a candidate for a skill.

**Mental model:** Skills are like giving Hermes a cheat sheet before a task. Instead of explaining "use the Traceix API endpoint at this URL, with this auth header, and parse the response like this" every single time, you write it once as a skill, and Hermes loads it whenever needed.

---

### 1.2 Where skills live

```
~/.hermes/skills/                          # your installed skills
├── autonomous-ai-agents/
│   └── hermes-agent/
│       ├── SKILL.md                       # the skill itself
│       └── references/                    # linked files (docs, templates)
│           ├── webhooks.md
│           └── native-mcp.md
└── traceix-api-integration/
    └── SKILL.md
```

Profiles have their own skills: `~/.hermes/profiles/<name>/skills/`

---

### 1.3 CLI commands — finding and installing skills

```bash
# Browse the skills catalog (interactive)
hermes skills browse

# Search the catalog
hermes skills search "docker"
hermes skills search "pentesting"
hermes skills search "python testing"

# Preview a skill before installing
hermes skills inspect github-code-review

# Install a skill from the hub
hermes skills install github-code-review

# Install from a direct URL
hermes skills install https://raw.githubusercontent.com/user/repo/main/SKILL.md

# List your installed skills
hermes skills list

# Check for updates to installed skills
hermes skills check

# Update outdated skills
hermes skills update

# Uninstall a skill
hermes skills uninstall github-code-review

# Enable/disable skills per platform (CLI vs Telegram vs Discord)
hermes skills config

# Add a GitHub repo as a skill source (community skills)
hermes skills tap add https://github.com/some-user/hermes-skills
```

---

### 1.4 Loading skills into your session

Three ways:

**1. At startup (before chat begins)**
```bash
hermes --skills traceix-api-integration
hermes -s traceix-api-integration,github-code-review
```

**2. During a session (slash command)**
```
/skill traceix-api-integration
```

**3. During a session (automatically)**
If a skill is relevant to your task, Hermes auto-loads it. The skill's description and tags help Hermes decide when it's relevant.

---

### 1.5 Creating your own skills

There are two ways: agent-created (Hermes writes it) and human-created (you write it).

#### Agent-created (easiest)

After finishing a complex task, tell Hermes:
```
"Save this workflow as a skill called 'docker-deploy'"
```

Hermes will:
1. Analyze what it just did
2. Extract the reusable steps, commands, and pitfalls
3. Create a SKILL.md in `~/.hermes/skills/`
4. Tag it with `created_by: "agent"` (so the curator can manage it)

#### Human-created (more control)

Create the file yourself. Minimum structure:

```markdown
---
name: my-skill-name
description: "What this skill teaches Hermes to do"
version: 1.0.0
---

# My Skill

## When to use this skill
- When doing X
- When Y happens

## Steps
1. First do this
   ```bash
   command here
   ```
2. Then do that
3. Verify with this check

## Pitfalls
- Don't do X because Y will break
- Watch out for Z on Kali Linux

## Verification
- Run `command` and confirm output contains "success"
```

Save it anywhere under `~/.hermes/skills/<skill-name>/SKILL.md`.

After creating, reload:
```
/reload-skills
```

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

### 1.7 The Curator — automatic skill maintenance

The Curator is a background system that manages agent-created skills:

```bash
hermes curator status        # check curator health
hermes curator run           # trigger a maintenance pass
hermes curator pause         # pause background maintenance
hermes curator resume        # resume
hermes curator pin <name>    # protect a skill from auto-archive
hermes curator unpin <name>  # remove protection
hermes curator archive <name> # archive a stale skill
hermes curator restore <name> # restore from archive
hermes curator prune          # clean up archives
hermes curator backup         # manual backup
hermes curator rollback       # restore from backup
```

In-session equivalent:
```
/curator status
/curator run
```

**What the Curator does (safely):**
- Tracks how often each skill is used
- Marks idle skills as "stale" (configurable: `curator.stale_after_days`)
- Archives stale skills (never deletes — max destructive action is archive)
- Pinned skills are exempt from ALL automatic transitions
- Runs a pre-backup tar.gz before any changes

**What the Curator does NOT do:**
- Never touches bundled or hub-installed skills (only `created_by: "agent"`)
- Never deletes — archive is the hardest action
- Consolidation (merging overlapping skills) is OFF by default — opt-in with `curator.consolidate: true`

---

### 1.8 When to create a skill vs when not to

**Create a skill when:**
- You solved a complex problem (5+ steps) you'll face again
- You hit an error, figured out the fix, and want to remember it
- You discovered a Kali-specific quirk that differs from regular Linux
- You have a tool with specific flags/env vars you always forget
- Hermes corrected you on something environment-specific

**Don't create a skill when:**
- It's a one-off task you'll never repeat
- It's a single simple command
- It's already covered by an existing skill (search first!)
- It's better as a memory entry (preferences, names, environment facts)

---

### 1.9 Skills workflow cheat sheet

```
GOAL                                    COMMAND
──────────────────────────────────────────────────────────────────
Find skills for X                       hermes skills search X
Preview a skill                         hermes skills inspect name
Install a skill                         hermes skills install name
List my skills                          hermes skills list
Load skill for this session             /skill name (in chat)  OR  hermes -s name
Ask Hermes to save workflow as skill    "Save this as a skill called 'name'"
Create a skill manually                 mkdir ~/.hermes/skills/name/ → create SKILL.md → /reload-skills
Check for updates                       hermes skills check
Protect a skill from auto-archive       hermes curator pin name
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

**Mental model:** Memory is Hermes's long-term notebook. Every session, Hermes gets a copy of your memory injected into the conversation. This is why Hermes remembers your name (Skull_crusher), your timezone (IST), and that you use Kali in VirtualBox — it's all in memory.

---

### 3.2 What's already in your memory

Right now, your memory contains (I can see it at the top of every session):

**User profile (94% full):**
- Name: Skull_crusher, Telegram: @Skullcrusher0366
- Location: Gujarat, India, IST timezone
- Cybersecurity student, offensive security focus
- Skill levels: Linux beginner, Networking learning, Kali tools beginner, Python 7/10, C 7/10, JS 6/10, Bash 3/10
- Goals: Bug bounty → Windows red team → malware analysis → exploit dev in Rust
- Communication: Simple English, step-by-step, verify-first, no jargon

**Agent memory (46% full):**
- Engineering preferences (think first, correctness over speed)
- Environment: Kali Linux VM on VirtualBox on Windows laptop
- Hermes terminal tool quirk (uv add blocked, use pyproject.toml + uv sync)
- TraceixExplorer project details (path, Python version, venv, deps)

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
"When working on the TraceixExplorer project in /home/kali/Coding/TraceixExplorer, always use Python 3.12 with the virtual environment at .venv/bin/activate and use uv for package management..."
```

That should be a SKILL, not a memory entry. Memory is for quick facts; skills are for procedures.

---

### 3.9 Memory vs Skills vs Project Context — when to use which

| System | What it's for | Example |
|--------|--------------|---------|
| **Memory** | Quick facts that survive all sessions | "User is in IST timezone", "Use uv not pip" |
| **Skills** | Reusable procedures and workflows | "How to deploy this app to Docker", "Traceix API integration" |
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
session_search(query="TraceixExplorer Docker setup")
session_search(query="nmap scan techniques")
```

This is how Hermes finds "what did we discuss about X last week" without you repeating yourself.

---

## PART 4: PUTTING IT ALL TOGETHER

### Real example: Your TraceixExplorer project

Here's how these three systems work together for your actual project:

**Project context (`.hermes.md` at `/home/kali/Coding/TraceixExplorer/.hermes.md`):**
```markdown
# TraceixExplorer

## Setup
- Python 3.12, venv at .venv/
- Use `uv sync` to install deps, NEVER `uv add` or `uv pip install`
- API key in .env: TRACEIX_API_KEY

## Run
- Dev server: `uv run uvicorn main:app --reload --port 8000`
- Tests: `uv run pytest -xvs`

## Style
- FastAPI + Jinja2 + Tailwind CDN
- All routes in routes/ directory
- Templates in templates/
```

**Skill (`traceix-api-integration`):**
Teaches Hermes the Traceix API endpoints, auth headers, response format, and how to parse results.

**Memory (already saved):**
```
TraceixExplorer: /home/kali/Coding/TraceixExplorer, Python 3.12,
venv .venv/bin/activate, uv, FastAPI+Jinja2+Tailwind CDN,
Traceix API key in .env. Skill: traceix-api-integration.
```

**Result:** When you run `hermes` in the TraceixExplorer directory, Hermes automatically:
1. Loads `.hermes.md` (knows build commands, style, structure)
2. Has the `traceix-api-integration` skill available
3. Remembers the project path, venv, and deps from memory
4. Can search past sessions for "TraceixExplorer" discussions

You never need to re-explain anything.

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
Find a skill            hermes skills search <query>
Install a skill         hermes skills install <name>
List my skills          hermes skills list
Load in session         /skill <name>  OR  hermes -s <name>
Create from chat        "Save this as a skill called 'name'"
Check for updates       hermes skills check
Protect from archive    hermes curator pin <name>
Reload skills           /reload-skills
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
