# Hermes Agent — Plugins Guide: Custom Tools, Hooks & Extensions

> Plugins are how you EXTEND Hermes with your own code — custom tools, lifecycle hooks, slash commands, and CLI subcommands. No need to modify Hermes core. Drop a Python file in a folder and Hermes picks it up. This guide covers everything: what plugins can do, how to build one, real use cases, and the decision guide (plugin vs skill vs MCP).

---

## PART 1: WHAT IS A PLUGIN?

### 1.1 The problem plugins solve

Hermes has built-in tools (terminal, read_file, web_search, etc.). But what if you need:

- A tool that checks your TryHackMe progress via their API?
- A slash command `/scan` that runs your custom nmap wrapper?
- A hook that logs every tool call to a file for debugging?
- A CLI command `hermes backup` that exports all your sessions?

You can't modify Hermes core (it updates, your changes get wiped). Plugins are the answer — they live in your `~/.hermes/plugins/` folder, outside the core code, and Hermes auto-discovers them.

### 1.2 Plugin vs Skill vs MCP — the decision guide

| What you want to build | Use | Why |
|------------------------|------|-----|
| A custom TOOL (Python function the LLM can call) | **Plugin** | Plugins register tools via `ctx.register_tool()` |
| A lifecycle HOOK (do something on session start/tool call) | **Plugin** | Only plugins can register hooks |
| A slash COMMAND (like `/scan` inside chat) | **Plugin** | `ctx.register_command()` |
| A CLI subcommand (`hermes mytool`) | **Plugin** | `ctx.register_cli_command()` |
| A reusable PROCEDURE (do X, then Y, then Z) | **Skill** | Skills are markdown, no code needed |
| An external TOOL from another ecosystem | **MCP** | MCP connects external servers |
| Data FILES shipped with your extension | **Plugin** | Plugins can bundle data files |
| Both tools AND a skill together | **Plugin** | Plugins can bundle skills inside them |

**Rule of thumb:** If it needs Python CODE → Plugin. If it's instructions/knowledge → Skill. If it's an existing external service → MCP.

---

## PART 2: PLUGIN DISCOVERY — WHERE PLUGINS LIVE

Hermes auto-discovers plugins from three locations:

```
1. ~/.hermes/plugins/           ← Your personal plugins (always loaded)
2. ./.hermes/plugins/           ← Project-local plugins (disabled by default)
3. pip-installed entry points   ← Plugins from pip packages
```

### Project-local plugins (security note)

Project-local plugins (`.hermes/plugins/` in a repo) are DISABLED by default. This prevents a cloned repo from running malicious code automatically. Enable them explicitly:

```bash
# For a trusted repo:
HERMES_ENABLE_PROJECT_PLUGINS=true hermes

# Or set permanently in .env:
echo "HERMES_ENABLE_PROJECT_PLUGINS=true" >> ~/.hermes/.env
```

---

## PART 3: PLUGIN ANATOMY — THE MINIMUM STRUCTURE

Every plugin needs at minimum two files:

```
~/.hermes/plugins/my-plugin/
├── manifest.yaml          # Metadata: name, version, description
└── __init__.py            # register(ctx) function + your code
```

### manifest.yaml

```yaml
name: my-plugin
version: "1.0.0"
description: "What this plugin does"
author: "Your Name"
```

### __init__.py — minimum working plugin

```python
def register(ctx):
    """Called once at Hermes startup. Register tools, hooks, commands here."""
    pass  # We'll add real things here
```

That's it. Drop these two files in `~/.hermes/plugins/my-plugin/`, restart Hermes, and the plugin is loaded (though it does nothing yet).

---

## PART 4: WHAT PLUGINS CAN DO — THE ctx API

Inside `register(ctx)`, you have access to these registration methods:

| Method | What it creates | Example |
|--------|----------------|---------|
| `ctx.register_tool()` | A tool the LLM can call | Database query tool, API wrapper |
| `ctx.register_hook()` | Lifecycle event listener | Log tool calls, notify on errors |
| `ctx.register_command()` | In-session slash command | `/scan`, `/deploy`, `/backup` |
| `ctx.register_cli_command()` | CLI subcommand | `hermes mytool scan` |
| `ctx.resolve_path()` | Path to plugin's data files | Read bundled configs, templates |

---

## PART 5: BUILDING A CUSTOM TOOL (Real Example)

### 5.1 The simplest tool — Hello World

```python
# ~/.hermes/plugins/hello-world/__init__.py
import json

def hello_world(name: str = "World") -> str:
    """Say hello to someone."""
    return json.dumps({"greeting": f"Hello, {name}!"})

def register(ctx):
    ctx.register_tool(
        name="hello_world",
        toolset="custom",                          # which toolset to add to
        description="Say hello to someone by name",
        parameters={
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name to greet"
                }
            }
        },
        handler=lambda args, **kw: hello_world(
            name=args.get("name", "World")
        )
    )
```

**Restart Hermes. Now you can say:**

```
"Say hello to Skullcrusher"
→ Hermes calls hello_world(name="Skullcrusher")
→ Returns: {"greeting": "Hello, Skullcrusher!"}
```

### 5.2 Real tool: TryHackMe Progress Checker

```python
# ~/.hermes/plugins/thm-checker/__init__.py
import json
import os
import requests

THM_API_KEY = os.getenv("THM_API_KEY", "")
THM_USERNAME = os.getenv("THM_USERNAME", "")

def check_thm_progress() -> str:
    """Fetch TryHackMe learning progress via API."""
    if not THM_API_KEY:
        return json.dumps({"error": "THM_API_KEY not set in .env"})

    resp = requests.get(
        f"https://tryhackme.com/api/user/{THM_USERNAME}",
        headers={"api-key": THM_API_KEY},
        timeout=10
    )
    if resp.status_code != 200:
        return json.dumps({"error": f"API returned {resp.status_code}"})

    data = resp.json()
    return json.dumps({
        "username": data.get("username"),
        "rank": data.get("rank"),
        "points": data.get("points"),
        "rooms_completed": data.get("roomsCompleted"),
        "current_streak": data.get("streak"),
    })

def register(ctx):
    ctx.register_tool(
        name="check_thm_progress",
        toolset="custom",
        description="Check your TryHackMe learning progress, rank, points, and streak",
        parameters={"type": "object", "properties": {}},
        handler=lambda args, **kw: check_thm_progress(),
        requires_env=["THM_API_KEY", "THM_USERNAME"]
    )
```

**What you can say:**
```
"Check my TryHackMe progress"
→ Hermes calls check_thm_progress()
→ Returns your rank, points, streak, rooms completed
```

### 5.3 Real tool: Nmap Quick Scan Wrapper

```python
# ~/.hermes/plugins/quick-scan/__init__.py
import json
import subprocess

def quick_scan(target: str, ports: str = "1-1000") -> str:
    """Run a quick nmap scan on a target."""
    if not target:
        return json.dumps({"error": "No target specified"})

    cmd = ["nmap", "-sV", "-sC", "-p", ports, target, "-oN", "-"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        return json.dumps({
            "target": target,
            "exit_code": result.returncode,
            "output": result.stdout[-3000:],  # last 3000 chars
            "stderr": result.stderr[-500:] if result.stderr else ""
        })
    except subprocess.TimeoutExpired:
        return json.dumps({"error": "Scan timed out after 120 seconds"})
    except FileNotFoundError:
        return json.dumps({"error": "nmap not found. Install: sudo apt install nmap"})

def register(ctx):
    ctx.register_tool(
        name="quick_scan",
        toolset="custom",
        description="Run a quick nmap service/script scan on a target IP or hostname",
        parameters={
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "Target IP address or hostname"
                },
                "ports": {
                    "type": "string",
                    "description": "Port range (default: 1-1000)"
                }
            },
            "required": ["target"]
        },
        handler=lambda args, **kw: quick_scan(
            target=args.get("target", ""),
            ports=args.get("ports", "1-1000")
        )
    )
```

**What you can say:**
```
"Quick scan 192.168.1.100"
"Run a quick scan on target.com ports 80,443,8080"
→ Hermes calls quick_scan() → returns nmap output
```

---

## PART 6: LIFECYCLE HOOKS — React to Events

### 6.1 Available hooks

Plugins can subscribe to these lifecycle events:

| Hook Event | When it fires | Use case |
|-----------|---------------|----------|
| `before_session_start` | Before a new session begins | Initialize resources, check prerequisites |
| `after_session_start` | After session is ready | Log session start, send notification |
| `before_llm_call` | Before each LLM API call | Log prompts, modify context |
| `after_llm_call` | After LLM responds | Log responses, track token usage |
| `before_tool_call` | Before any tool executes | Validate input, add logging |
| `after_tool_call` | After tool completes | Log results, track performance |
| `on_session_end` | Session closing | Cleanup, save state, notify |
| `on_error` | When an error occurs | Alert, log, retry logic |
| `on_user_message` | When user sends a message | Pre-process messages |
| `on_agent_message` | When agent generates response | Post-process responses |

### 6.2 Hook example: Tool Call Logger

```python
# ~/.hermes/plugins/tool-logger/__init__.py
import json
import time
from pathlib import Path

LOG_FILE = Path.home() / ".hermes" / "logs" / "tool_calls.jsonl"

def log_tool_call(tool_name: str, args: dict, result: str, duration_ms: float):
    """Log every tool call to a JSONL file."""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": time.time(),
        "tool": tool_name,
        "args": str(args)[:500],
        "result_preview": str(result)[:200],
        "duration_ms": round(duration_ms, 2)
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

def register(ctx):
    # Track timing
    _start_times = {}

    def before_tool(tool_name, args, **kwargs):
        _start_times[tool_name] = time.time()

    def after_tool(tool_name, args, result, **kwargs):
        start = _start_times.pop(tool_name, time.time())
        duration = (time.time() - start) * 1000
        log_tool_call(tool_name, args, result, duration)

    ctx.register_hook("before_tool_call", before_tool)
    ctx.register_hook("after_tool_call", after_tool)
```

**Effect:** Every tool call gets logged to `~/.hermes/logs/tool_calls.jsonl`. Useful for debugging, performance tracking, or auditing what Hermes does.

### 6.3 Hook example: Session Start Notifier (Telegram)

```python
# ~/.hermes/plugins/session-notify/__init__.py
import subprocess
import os
from datetime import datetime

def notify_session_start():
    """Log session start with timestamp."""
    log_path = Path.home() / ".hermes" / "logs" / "sessions.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "a") as f:
        f.write(f"Session started: {datetime.now().isoformat()}\n")

def register(ctx):
    ctx.register_hook("after_session_start", lambda **kw: notify_session_start())
```

---

## PART 7: SLASH COMMANDS — Custom /commands in Chat

### 7.1 Registering a slash command

```python
# ~/.hermes/plugins/my-commands/__init__.py
import json
from datetime import datetime

def cmd_status(args, session):
    """Handle /mystatus slash command."""
    return {
        "text": f"✅ Plugin active. Time: {datetime.now().strftime('%H:%M:%S')}"
    }

def cmd_backup(args, session):
    """Handle /mybackup slash command."""
    import subprocess
    result = subprocess.run(
        ["hermes", "sessions", "export", "--title", "Project:", 
         str(Path.home() / "backups"), "--format", "jsonl"],
        capture_output=True, text=True, timeout=30
    )
    return {
        "text": f"Backup result:\n{result.stdout[:500]}"
    }

def register(ctx):
    ctx.register_command(
        name="mystatus",
        handler=cmd_status,
        description="Show custom plugin status"
    )
    ctx.register_command(
        name="mybackup",
        handler=cmd_backup,
        description="Backup all project sessions"
    )
```

**Now in any Hermes chat:**
```
/mystatus        → "✅ Plugin active. Time: 14:32:05"
/mybackup        → Runs backup, shows result
```

### 7.2 Real slash command: /scan for quick nmap

```python
def cmd_scan(args, session):
    """Handle /scan <target> slash command."""
    target = args.strip() if args else None
    if not target:
        return {"text": "❌ Usage: /scan <target IP or hostname>"}

    import subprocess
    result = subprocess.run(
        ["nmap", "-sV", "-sC", "-p", "1-1000", target],
        capture_output=True, text=True, timeout=120
    )
    output = result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout
    return {"text": f"```\n{output}\n```"}

def register(ctx):
    ctx.register_command(
        name="scan",
        handler=cmd_scan,
        description="Quick nmap scan: /scan <target>"
    )
```

```
/scan 192.168.1.1
→ nmap output appears in chat
```

---

## PART 8: CLI SUBCOMMANDS — hermes <your-command>

### 8.1 Registering a CLI subcommand

```python
# ~/.hermes/plugins/backup-tool/__init__.py
from pathlib import Path
import subprocess

def backup_sessions(args):
    """hermes backup sessions"""
    dest = Path.home() / "backups" / "hermes-sessions"
    dest.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["hermes", "sessions", "export", "--format", "jsonl", str(dest)],
        timeout=60
    )
    print(f"✅ Sessions exported to {dest}")

def backup_memory(args):
    """hermes backup memory"""
    import shutil
    dest = Path.home() / "backups" / "hermes-memory"
    dest.mkdir(parents=True, exist_ok=True)
    for f in ["MEMORY.md", "USER.md"]:
        src = Path.home() / ".hermes" / f
        if src.exists():
            shutil.copy2(src, dest / f)
    print(f"✅ Memory backed up to {dest}")

def register(ctx):
    ctx.register_cli_command(
        name="backup",
        subcommands={
            "sessions": backup_sessions,
            "memory": backup_memory,
        },
        description="Backup Hermes sessions and memory"
    )
```

**Now in terminal:**
```bash
hermes backup sessions     → Exports all sessions to ~/backups/
hermes backup memory       → Copies MEMORY.md and USER.md to ~/backups/
hermes backup --help       → Shows subcommands
```

---

## PART 9: BUNDLED DATA & SKILLS

### 9.1 Shipping data files with your plugin

```
~/.hermes/plugins/nmap-presets/
├── manifest.yaml
├── __init__.py
└── data/
    ├── quick-scan.sh           # Shell script
    ├── preset-web.json         # Web scan preset
    └── preset-full.json        # Full scan preset
```

```python
# __init__.py
def register(ctx):
    # Access bundled files
    quick_scan_path = ctx.resolve_path("data/quick-scan.sh")
    preset_web_path = ctx.resolve_path("data/preset-web.json")

    # Use them in your tools
    def run_preset_scan(preset_name: str, target: str) -> str:
        preset_file = ctx.resolve_path(f"data/preset-{preset_name}.json")
        # Read preset, run scan...
        pass
```

### 9.2 Bundling a skill inside a plugin

```python
def register(ctx):
    ctx.register_tool(...)

    # Also register a bundled skill
    ctx.register_skill("nmap-presets")  # Loads SKILL.md from plugin dir
```

```
~/.hermes/plugins/nmap-presets/
├── manifest.yaml
├── __init__.py
├── SKILL.md                  # Skill bundled with the plugin
└── data/
    └── presets/
```

---

## PART 10: PLUGIN MANAGEMENT CLI

```bash
# List all installed plugins
hermes plugins list
# Shows: name, version, status (active/disabled/error), location

# Install a plugin
hermes plugins install <name>           # from catalog
hermes plugins install /path/to/plugin  # from local path
hermes plugins install https://...      # from URL

# Remove a plugin
hermes plugins remove <name>

# In-session:
/plugins          # interactive plugin manager (TUI)
```

---

## PART 11: REAL-WORLD PLUGIN IDEAS FOR YOU

Based on your pentesting + coding workflow, here are plugins worth building:

### For Pentesting:
```
Plugin                    What it does
─────────────────────────────────────────────────────
quick-scan               /scan <target> → nmap -sV -sC wrapper
recon-pipeline           /recon <target> → nmap + gobuster + whatweb
exploit-search           /exploit <CVE> → searchsploit + exploit-db lookup
hash-analyzer            /hash <hash> → identify hash type, check crackstation
network-diagram          /netmap → scan local subnet, draw network map
```

### For Coding:
```
Plugin                    What it does
─────────────────────────────────────────────────────
git-status-all           /gitall → check all repos in ~/Coding/ for unpushed changes
docker-tools             /dclean → prune unused Docker images/containers
env-checker              /envcheck → verify .env files, check API keys are set
project-init             hermes init <name> → create project from template
test-runner              /test → run tests for current project
```

### For Learning:
```
Plugin                    What it does
─────────────────────────────────────────────────────
thm-progress             /thm → check TryHackMe rank, streak, rooms
session-review           /review → summarize this session's key takeaways
flashcards               /card → generate a flashcard from last explanation
daily-brief              hermes brief → morning summary from cron job
```

---

## PART 12: BUILT-IN PLUGINS — What Ships with Hermes

Hermes ships with several built-in plugins that use the same plugin system:

| Plugin | What it provides |
|--------|-----------------|
| Platform adapters | Telegram, Discord, Slack, WhatsApp, etc. (under `plugins/platforms/`) |
| Memory providers | Mem0, Honcho, Hindsight, etc. (`plugins/memory_providers/`) |
| Gateway core | Message routing, session management |
| Cron scheduler | Background job execution |

These are maintained in Hermes core but use the same `register(ctx)` API. They prove the plugin system is production-ready.

---

## PART 13: DEBUGGING PLUGINS

```bash
# Check if plugin loaded
hermes plugins list
# Look for your plugin: "active" means it loaded successfully

# Check for errors
cat ~/.hermes/logs/gateway.log | grep -i plugin
cat ~/.hermes/logs/error.log | grep -i plugin

# Enable verbose startup (see plugin loading messages)
hermes --verbose

# Test a tool manually
# In Hermes chat:
"Call the hello_world tool with name=Test"

# Common issues:
# 1. manifest.yaml missing or invalid YAML
# 2. register() function not defined in __init__.py
# 3. Python syntax error in __init__.py
# 4. Missing dependency (import error)
# 5. toolset name doesn't exist (use "custom" for personal plugins)
```

---

## QUICK REFERENCE

### Plugin file structure
```
~/.hermes/plugins/my-plugin/
├── manifest.yaml          # Required: name, version, description
├── __init__.py            # Required: register(ctx) function
├── SKILL.md               # Optional: bundled skill
└── data/                  # Optional: shipped data files
    └── ...
```

### ctx API cheat sheet
```python
def register(ctx):
    # Add a tool the LLM can call
    ctx.register_tool(name="...", toolset="custom",
                      description="...", parameters={...},
                      handler=lambda args, **kw: ...)

    # Subscribe to lifecycle events
    ctx.register_hook("after_tool_call", my_handler)

    # Add a slash command (/mycommand in chat)
    ctx.register_command(name="mycommand", handler=my_handler,
                         description="...")

    # Add a CLI subcommand (hermes mytool)
    ctx.register_cli_command(name="mytool", subcommands={...})

    # Access bundled files
    path = ctx.resolve_path("data/config.json")
```

### Management commands
```
List plugins            hermes plugins list
Install plugin          hermes plugins install <name>
Remove plugin           hermes plugins remove <name>
In-session manager      /plugins
Enable project plugins  HERMES_ENABLE_PROJECT_PLUGINS=true hermes
```

### Plugin vs Skill vs MCP
```
Need Python CODE?              → Plugin
Need instructions/knowledge?   → Skill
Need external service tool?    → MCP
Need lifecycle hooks?          → Plugin (only option)
Need slash command /mything?   → Plugin
Need CLI command hermes my?    → Plugin
```

---

## GETTING STARTED — 5 MINUTE PLUGIN

```bash
# 1. Create the plugin directory
mkdir -p ~/.hermes/plugins/hello-world

# 2. Create manifest.yaml
cat > ~/.hermes/plugins/hello-world/manifest.yaml << 'EOF'
name: hello-world
version: "1.0.0"
description: "My first Hermes plugin"
EOF

# 3. Create __init__.py
cat > ~/.hermes/plugins/hello-world/__init__.py << 'EOF'
import json

def hello(name: str = "World") -> str:
    return json.dumps({"message": f"Hello, {name}!"})

def register(ctx):
    ctx.register_tool(
        name="hello_world",
        toolset="custom",
        description="Say hello to someone",
        parameters={
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Who to greet"}
            }
        },
        handler=lambda args, **kw: hello(args.get("name", "World"))
    )
EOF

# 4. Restart Hermes
# /reset  or  exit + hermes

# 5. Test it
# "Say hello to Skullcrusher"
```

That's a working plugin in 5 minutes. From here, add hooks, slash commands, or wrap your pentesting tools. The plugin system is the bridge between "Hermes is a chatbot" and "Hermes is MY agent with MY tools."
