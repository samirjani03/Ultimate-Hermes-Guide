# Hermes Agent — CLI/TUI Mastery + Terminal Tool Deep Dive

> **Official reference:** This guide is checked against the [Hermes CLI documentation](https://hermes-agent.nousresearch.com/docs/user-guide/cli), [TUI documentation](https://hermes-agent.nousresearch.com/docs/user-guide/tui), and [CLI Commands Reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands). Refer to them for current interface and command behavior.

> Complete guide covering the two things you touch every session: the interface (CLI/TUI) and the execution engine (Terminal tool).

---

## PART 1: CLI & TUI MASTERY

### 1.1 What surface are you on?

Hermes has multiple "surfaces" (interfaces). You're using:

```
hermes                  → CLI (default, text-based)
```

If you set `display.interface: tui` in config, you get the Ink TUI (rich terminal UI with panels, status bars, skins). This guide covers both — CLI commands work the same either way.

```
hermes desktop          → Native Electron desktop app
hermes dashboard        → Web admin panel
```

For now, focus on the CLI. It's where you'll live 99% of the time.

---

### 1.2 Starting Hermes — the flags you'll actually use

```bash
# Plain start (interactive chat)
hermes

# Single question, no interactive session
hermes chat -q "Explain this C code: <paste code>"

# Resume your last session
hermes --continue

# Resume by title
hermes --resume "Building TraceixExplorer"

# Start with specific skills pre-loaded
hermes --skills traceix-api-integration

# Skip dangerous-command approval prompts (use carefully)
hermes --yolo

# Use a different profile
hermes --profile work
```

**When to use each:**

| Flag | Use case |
|------|----------|
| `--continue` / `-c` | Continue yesterday's work. Most used flag. |
| `--resume <id>` | Jump to a specific named session |
| `--skills <name>` | Load a skill at startup (like traceix-api-integration) |
| `--yolo` | You trust the commands, skip approval prompts. Good for Docker/builds. |
| `--profile <name>` | Switch between work/personal/study profiles |
| `-q "..."` | Fire-and-forget: get an answer without entering chat mode |
| `-m <model>` | Override model for this session only |
| `--checkpoints` | Enable /rollback (filesystem snapshots) |

---

### 1.3 Config management (set once, forget)

```bash
hermes config                # view current config
hermes config edit           # open config.yaml in your editor
hermes config set KEY VAL    # set a single value
hermes config path           # where is config.yaml?
hermes config env-path       # where is .env?
hermes config check          # am I missing anything?
hermes config migrate        # pull in new config options after upgrade
hermes doctor                # health check (deps, config, providers)
hermes doctor --fix          # auto-fix what's broken
```

**Settings you should configure day 1:**

```bash
# Terminal timeout (default 180s is fine for most things, bump for long builds)
hermes config set terminal.timeout 300

# Show what commands are running (so you see what Hermes executes)
hermes config set display.tool_progress true

# Show token cost after each turn (helps you learn what's expensive)
hermes config set display.show_cost true

# Command approval: smart mode uses an aux-LLM to auto-approve safe commands
hermes config set approvals.mode smart

# Set your default model
hermes model
```

---

### 1.4 Model switching

```bash
hermes model                    # interactive picker (browse providers + models)

# During a session:
/model                          # show current model
/model anthropic/claude-sonnet-4  # switch mid-session

# At startup:
hermes -m "openrouter/deepseek/deepseek-chat"
```

**Pro tip for a student on a budget:** DeepSeek is cheap and excellent for coding. Use it as your daily driver, switch to Claude or GPT-4 for hard reasoning tasks.

---

### 1.5 Slash commands — the ones that matter

Type these DURING a chat session. They all start with `/`.

#### Session control (daily use)

| Command | What it does |
|---------|-------------|
| `/new` or `/reset` | Start fresh session. Use when context gets bloated or topic changes. |
| `/clear` | Clear screen + new session (CLI only) |
| `/title My Task` | Name the current session |
| `/retry` | Resend your last message (model gave bad answer) |
| `/undo` | Remove the last exchange (you + assistant) |
| `/compress` | Manually trigger context compression |
| `/stop` | Kill all background processes |
| `/background <prompt>` | Run a prompt in background, keep working |
| `/queue <prompt>` | Queue a message for next turn |
| `/steer <prompt>` | Inject a correction after the next tool call |
| `/resume <name>` | Jump to a named session |

**When to use `/steer`:** Hermes is mid-task, you see it going wrong. Type `/steer Actually use port 8080 not 3000` — it injects your correction after the current tool call finishes, without interrupting.

#### Configuration during session

| Command | What it does |
|---------|-------------|
| `/model <name>` | Switch model mid-session |
| `/yolo` | Toggle approval bypass on/off |
| `/verbose` | Cycle: off → new → all → verbose (see tool calls happening) |
| `/reasoning high` | Make model think harder (levels: none, minimal, low, medium, high, xhigh) |
| `/reasoning show` | Show the model's thinking in chat |
| `/reasoning hide` | Hide thinking again |

**When to use `/reasoning`:** For hard problems (debugging, exploit analysis, complex code review). Switch to `high` or `xhigh`. For quick questions, keep it `none` or `low` to save tokens.

#### Tools & skills

| Command | What it does |
|---------|-------------|
| `/tools` | Manage enabled tools (interactive TUI) |
| `/toolsets` | List available toolsets |
| `/skills` | Browse and install skills |
| `/skill <name>` | Load a skill into current session |
| `/reload-skills` | Rescan ~/.hermes/skills/ for new skills |
| `/reload` | Reload .env variables |
| `/cron` | Manage cron jobs |

#### Utility

| Command | What it does |
|---------|-------------|
| `/history` | Show conversation history |
| `/save` | Save conversation to file |
| `/copy 1` | Copy last assistant response to clipboard |
| `/paste` | Attach clipboard image |
| `/image /path/to/img` | Attach local image for vision analysis |
| `/browser` | Open CDP browser connection |
| `/branch` | Fork current session into a new one |

#### Info

| Command | What it does |
|---------|-------------|
| `/help` | Show all available commands |
| `/usage` | Token usage for current session |
| `/status` | Session info |
| `/profile` | Active profile details |
| `/debug` | Upload debug report, get shareable link |

#### Exit

| Command | What it does |
|---------|-------------|
| `/quit` or `/exit` or `/q` | Exit Hermes |

---

### 1.6 TUI-specific features

Only relevant if you use `display.interface: tui` or run `hermes` from a TUI-enabled terminal.

```bash
hermes config set display.interface tui   # switch to TUI
hermes config set display.interface cli   # switch back to CLI
```

TUI-only slash commands:

| Command | What it does |
|---------|-------------|
| `/skin <name>` | Change color theme |
| `/statusbar` | Toggle status bar on/off |
| `/indicator kaomoji` | Change busy spinner style (kaomoji, emoji, unicode, ascii) |
| `/redraw` | Force full UI repaint (if display glitches) |
| `/busy queue` | What Enter does while Hermes is working (queue, steer, interrupt, status) |

**`/busy` is actually useful in CLI too:** When Hermes is running a long tool call, `/busy queue` makes Enter queue your message instead of immediately sending it.

---

### 1.7 Daily workflow patterns

**Pattern 1: Continue yesterday's work**
```bash
hermes --continue
# Hermes resumes your last session with full context
"Continue working on the TraceixExplorer search feature"
```

**Pattern 2: Fire-and-forget research**
```bash
hermes chat -q "Research CVE-2024-XXXX: exploitation vector, affected versions, PoC availability. Write summary to ~/research/cve-2024-XXXX.md"
```

**Pattern 3: Multi-task session**
```
You: Build a REST API for user management in FastAPI
... Hermes works ...
/background Write unit tests for the API while I review the code
... you review code while Hermes writes tests in background ...
```

**Pattern 4: Model hop for hard problems**
```
You: Debug this race condition in my C code
... Hermes (DeepSeek) tries ...
/model anthropic/claude-sonnet-4
/retry
... Claude tackles the hard problem ...
/model openrouter/deepseek/deepseek-chat
... switch back for cheaper work ...
```

---

## PART 2: TERMINAL TOOL DEEP DIVE

### 2.1 How the terminal tool works

The terminal tool gives Hermes a persistent shell. This means:

- **Environment variables persist** between calls (export once, use everywhere)
- **Working directory persists** (cd once, stay there)
- **Background processes survive** (start a server, it keeps running)
- **Virtualenv activation sticks** (activate once per session)

Think of it as Hermes having its own terminal tab that lives for the whole session.

```bash
# Hermes does this:
cd /home/kali/Coding/TraceixExplorer
source .venv/bin/activate
# Now every subsequent terminal call runs in that venv, in that directory
```

---

### 2.2 Foreground execution (default)

Commands run and return instantly when done.

```bash
# Hermes calls:
terminal(command="nmap -sV 192.168.1.1", timeout=60)
# Returns: output + exit code
```

**Key parameters:**

| Parameter | Default | What it does |
|-----------|---------|-------------|
| `command` | (required) | The shell command |
| `timeout` | 180s | Max wait time. Set higher for long builds. Max 600s foreground. |
| `workdir` | session cwd | Override working directory for this one command |

```bash
# Long build — bump timeout
terminal(command="docker build -t myapp .", timeout=300)

# Run in specific directory without changing session cwd
terminal(command="git status", workdir="/home/kali/Coding/OtherProject")
```

---

### 2.3 Background execution (servers + long tasks)

Two legitimate patterns:

**Pattern A: Servers that never exit (web servers, databases)**
```bash
terminal(command="python -m http.server 8080", background=true)
# Returns session_id immediately. Server runs forever.
# Check output: process(action="poll", session_id="...")
# Check logs:   process(action="log", session_id="...")
# Kill it:      process(action="kill", session_id="...")
```

**Pattern B: Long tasks that WILL finish (builds, tests, scans)**
```bash
terminal(command="nmap -p- 192.168.1.0/24", background=true, notify_on_complete=true)
# You get notified when it's done. Keep working in the meantime.
```

**CRITICAL:** Always use `notify_on_complete=true` for bounded tasks. Without it, the process runs silently and you'll never know it finished.

**DO NOT use `nohup`, `disown`, `setsid`, or trailing `&` in foreground mode.** Use `background=true` instead — Hermes tracks the process properly.

---

### 2.4 Process management

Once something is running in background, manage it with the `process` tool:

```bash
process(action="list")                          # show all background processes
process(action="poll", session_id="abc123")      # check status + new output
process(action="log", session_id="abc123")       # full output (pagination with offset/limit)
process(action="wait", session_id="abc123", timeout=60)  # block until done
process(action="kill", session_id="abc123")      # terminate
process(action="submit", session_id="abc123", data="y")  # send "y" + Enter (answer prompts)
process(action="write", session_id="abc123", data="input") # send raw stdin
process(action="close", session_id="abc123")     # close stdin / send EOF
```

---

### 2.5 PTY mode (interactive tools)

Some tools need a real terminal (pseudo-terminal). Use `pty=true`:

```bash
terminal(command="python", pty=true)             # Python REPL
terminal(command="msfconsole", pty=true)         # Metasploit
terminal(command="mysql -u root -p", pty=true)   # MySQL client
```

Without `pty=true`, interactive tools will hang or behave weirdly because they expect a TTY.

**For complex interactive sessions, use tmux (see section 2.8).**

---

### 2.6 Docker patterns

```bash
# Build an image
terminal(command="docker build -t myapp:latest .", timeout=300)

# Run a container
terminal(command="docker run -d --name myapp -p 8080:8080 myapp:latest")

# Run a one-off command in a container
terminal(command="docker exec myapp python manage.py migrate")

# Docker Compose
terminal(command="docker compose up -d", timeout=120)
terminal(command="docker compose logs --tail=50")
terminal(command="docker compose down")

# Prune old stuff
terminal(command="docker system prune -f")
```

**Pattern: Start a service and verify it**
```bash
# 1. Start in background
terminal(command="docker compose up", background=true)

# 2. Wait for health
terminal(command="sleep 5 && curl -s http://localhost:8080/health")

# 3. Now use it
terminal(command="curl -X POST http://localhost:8080/api/users -d '...'")
```

---

### 2.7 Pentesting tool patterns

**nmap scans**
```bash
# Quick scan
terminal(command="nmap -sV -sC 192.168.1.100", timeout=120)

# Full port scan (LONG — use background!)
terminal(command="nmap -p- -sV 192.168.1.100", background=true, notify_on_complete=true)

# Network range scan
terminal(command="nmap -sn 192.168.1.0/24", timeout=60)
```

**Metasploit**
```bash
# Non-interactive msf commands with -x
terminal(command="msfconsole -q -x 'use auxiliary/scanner/ssh/ssh_login; set RHOSTS 192.168.1.100; set USER_FILE /usr/share/wordlists/rockyou.txt; set PASS_FILE /usr/share/wordlists/rockyou.txt; run; exit'", timeout=120)

# For interactive msfconsole, use tmux (see 2.8)
```

**Gobuster / ffuf (web enumeration)**
```bash
terminal(command="gobuster dir -u http://192.168.1.100 -w /usr/share/wordlists/dirb/common.txt", timeout=120)
terminal(command="ffuf -u http://192.168.1.100/FUZZ -w /usr/share/wordlists/dirb/common.txt", timeout=120)
```

**sqlmap**
```bash
terminal(command="sqlmap -u 'http://target.com/page.php?id=1' --batch --level=2", timeout=180)
```

**hydra**
```bash
terminal(command="hydra -l admin -P /usr/share/wordlists/rockyou.txt 192.168.1.100 ssh", background=true, notify_on_complete=true)
```

**General rule for pentesting tools:**
- Quick scans (< 2 min): foreground with appropriate timeout
- Long scans (brute force, full port): background + notify_on_complete
- Interactive tools (msfconsole, sqsh): use tmux

---

### 2.8 Tmux patterns (interactive tools)

When you need a real interactive session with a tool that expects a TTY:

```bash
# Start a named tmux session
terminal(command="tmux new-session -d -s scanner -x 120 -y 40", timeout=5)

# Send commands to it
terminal(command="tmux send-keys -t scanner 'msfconsole' Enter", timeout=5)
terminal(command="sleep 5 && tmux send-keys -t scanner 'search eternalblue' Enter", timeout=10)

# Read output
terminal(command="tmux capture-pane -t scanner -p", timeout=5)

# Kill when done
terminal(command="tmux kill-session -t scanner", timeout=5)
```

---

### 2.9 Git and build patterns

```bash
# Git
terminal(command="git status")
terminal(command="git diff")
terminal(command="git add -A && git commit -m 'Fix authentication bug'")
terminal(command="git push origin main")

# Python
terminal(command="uv sync")                              # install deps
terminal(command="uv run pytest -xvs")                    # run tests
terminal(command="uv run python -m myapp")                # run app

# Node.js
terminal(command="npm install")
terminal(command="npm run build")
terminal(command="npm test")

# Rust/Cargo
terminal(command="cargo build --release", timeout=300)
terminal(command="cargo test")
```

---

### 2.10 watch_patterns (for servers)

For long-lived servers where you want to know when they're "ready":

```bash
terminal(
    command="uv run uvicorn main:app --host 0.0.0.0 --port 8080",
    background=true,
    watch_patterns=["Application startup complete"]
)
# Hermes watches output. When "Application startup complete" appears,
# you get notified, and then you can hit the server.
```

**Rules of watch_patterns:**
- Max 1 notification per 15 seconds
- After 3 dropped matches (rate-limited), it auto-disables and switches to notify_on_complete
- Use ONLY for rare one-shot signals like "startup complete"
- Do NOT use for "ERROR" patterns in batch jobs — they fire too often

---

### 2.11 Best practices & pitfalls

**DO:**
- Activate venv once at session start, not before every command
- Use `background=true` + `notify_on_complete=true` for anything over 2 minutes
- Set generous timeouts — commands return instantly when done, so `timeout=600` doesn't make you wait 10 minutes
- Use `workdir=` for one-off directory changes instead of `cd`
- Pipe git output to `cat` if it might use a pager: `git log | cat`

**DON'T:**
- Don't use `nohup`/`disown`/`&` — use `background=true`
- Don't use `vim`/`nano` in terminal — use the `patch` or `write_file` tools instead
- Don't use `cat`/`head`/`tail` to read files — use `read_file` tool
- Don't use `grep`/`find` to search — use `search_files` tool
- Don't use `echo`/`cat heredoc` to create files — use `write_file` tool
- Don't use `sed`/`awk` to edit files — use `patch` tool

**Why these rules exist:** The dedicated tools (read_file, write_file, patch, search_files) are faster, more reliable, don't count against terminal timeouts, and give Hermes cleaner output to work with.

---

### 2.12 Quick reference card

```
GOAL                                 COMMAND PATTERN
──────────────────────────────────────────────────────────────────
Run a quick command                  terminal(cmd, timeout=60)
Long build                          terminal(cmd, timeout=600)
Server (never exits)                terminal(cmd, background=True)
Long task (will finish)             terminal(cmd, background=True, notify_on_complete=True)
Interactive tool (REPL, msf)        tmux new-session + send-keys
Run in different dir                terminal(cmd, workdir="/path")
Wait for server ready               terminal(cmd, background=True, watch_patterns=["ready"])
Check background process            process(action="poll", session_id=...)
Kill background process             process(action="kill", session_id=...)
Docker build/run                    terminal("docker build...", timeout=300)
nmap full scan                      terminal("nmap -p- ...", background=True, notify_on_complete=True)
Activate venv (do once)             terminal("source .venv/bin/activate")
Run tests                           terminal("uv run pytest -xvs")
```

---

## PART 3: PUTTING IT ALL TOGETHER

### Real workflow: Building a webapp with Docker

```bash
# 1. Start Hermes in your project
cd ~/Coding/MyWebApp
hermes --skills traceix-api-integration

# 2. In the session:
/model openrouter/deepseek/deepseek-chat    # cheap model for routine work
/verbose                                     # see what's happening
/yolo                                        # trust the commands

# 3. Tell Hermes what to do
"Build a FastAPI app with Docker. Start by creating the Dockerfile and docker-compose.yml"

# Hermes will:
#   - write_file Dockerfile
#   - write_file docker-compose.yml
#   - write_file requirements.txt (or edit pyproject.toml)
#   - terminal: docker compose up --build (background)
#   - terminal: curl localhost:8080/health (verify)
#   - report back

# 4. Need a hard problem solved?
/model anthropic/claude-sonnet-4
"Debug this race condition..."
```

### Real workflow: Pentesting lab

```bash
hermes --continue "THM Lab"

# In session:
/yolo

"Run a full port scan on 10.10.10.5, then enumerate the web server on port 80"

# Hermes will:
#   - terminal: nmap -p- 10.10.10.5 (background + notify)
#   - terminal: gobuster dir -u http://10.10.10.5 ...
#   - Summarize findings
```

---

That's it. Save this file somewhere you can `cat` it quickly. Next time you're stuck mid-session, type `/help` for the built-in reference — but this guide covers the mental models and patterns the built-in help doesn't teach.
