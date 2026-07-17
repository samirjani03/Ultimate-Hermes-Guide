# Hermes Agent Plugins: Beginner Guide (Free Setup + Pentesting Use Cases)

> **Official reference:** This guide is checked against the [Hermes Plugins documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins). Refer to it for the current plugin model, setup, and release-specific behavior.

## 1. What even is a "plugin"? (vs MCP vs Skills)

Hermes has THREE different ways to extend it. People mix them up all the time, so here's the simple breakdown:

| Thing | What it is | Where it lives | Cost |
|---|---|---|---|
| **Skill** | A single instruction file (SKILL.md) that teaches Hermes *how* to do one task | `~/.hermes/skills/` | Free, just text |
| **MCP server** | An external tool server Hermes connects to (nmap, GitHub, Shodan, etc) | Runs as its own process, Hermes talks to it | Free (tool itself), some need API keys |
| **Plugin** | Actual Python code that adds new tools, hooks into events, or changes core behavior | `~/.hermes/plugins/<name>/` | Free, open source |

Simple way to remember it: **Skills teach, MCP connects, Plugins build.**

A plugin can literally watch every message, every tool call, every file write, and react to it. That's the power difference, it's not just "one more tool," it's a hook into Hermes' brain.

---

## 2. How plugins actually work (the beginner mental model)

```
Hermes starts
  │
  ├── Scans <hermes-repo>/plugins/<name>/     ← built-in plugins (ship with Hermes)
  ├── Scans ~/.hermes/plugins/<name>/          ← your own / third-party plugins
  │
  ├── Finds plugin.yaml manifests
  │
  ├── Checks: is this plugin in plugins.enabled in config.yaml?
  │     NO  → discovered but sits dormant (shows in list, does nothing)
  │     YES → loads it, its tools/hooks go live
  │
  └── Ready — plugin tools work exactly like built-in tools
```

**Important beginner thing:** every plugin is **disabled by default**, even the ones that ship built-in with Hermes. This is on purpose, so random code doesn't run without you saying yes first. You always have to explicitly enable it.

A basic plugin folder looks like this:

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml       # manifest: name, version, what it needs
├── __init__.py        # register() function, wires everything up
├── schemas.py          # tool definitions (what the LLM sees)
└── tools.py            # the actual code that runs
```

---

## 3. All plugin commands (the full list)

```bash
# See every plugin Hermes found (enabled, disabled, or just discovered)
hermes plugins list

# Turn a plugin ON
hermes plugins enable <name>

# Turn a plugin OFF
hermes plugins disable <name>

# Install a new plugin (from a repo/source)
hermes plugins install <name>

# Update an installed plugin
hermes plugins update <name>

# Remove a plugin completely
hermes plugins remove <name>
```

In-session (while chatting with Hermes):

```
/plugins        # shows which plugins are currently loaded in THIS session
```

Config file way (edit `~/.hermes/config.yaml` directly):

```yaml
plugins:
  enabled:
    - security-guidance
    - my-tool-plugin
  disabled:              # optional, this always wins even if also listed above
    - noisy-plugin
```

---

## 4. Using plugins for FREE, step by step

Here's the actual point: **plugins cost nothing.** They're just code. The only thing that ever costs money in the Hermes world is the LLM model itself (or optional paid integrations like some SaaS connectors). So to run this whole thing for $0:

### Step 1: Use a free model backend
```bash
hermes model
# pick a free-tier option: OpenRouter free models, or a local model via Ollama
```
Plugins work identically no matter which model you're running underneath.

### Step 2: Enable a built-in plugin (it's already on your machine, just off)
```bash
hermes plugins list
# you'll see stuff like "security-guidance", "disk-cleanup" marked as disabled

hermes plugins enable security-guidance
```
That's it. No signup, no key, no cost. It's just been sitting there waiting for you to flip the switch.

### Step 3: Confirm it loaded
```
# start a new session, then type:
/plugins
```
You should see `security-guidance` listed as active.

### Step 4 (optional): Grab a free third-party plugin from GitHub
```bash
hermes plugins install <plugin-name-or-url>
hermes plugins enable <plugin-name>
```
Since these are open source, you're not paying anyone, you're just running someone's Python code inside your own Hermes.

---

## 5. Cool pentesting use cases using plugins 🕵️

These aren't about scanning tools (that's what MCP servers do), plugins shine at **watching, logging, and guarding** your pentest workflow. Here's the good stuff:

### Use case 1: Auto SAST-lite scanning during code review (`security-guidance`, built-in, free)
This one already ships with Hermes. Every time Hermes writes or patches a file, it checks the content against known dangerous patterns:

- `eval(`, `os.system(`, `subprocess(..., shell=True)`
- `pickle.load`, `yaml.load` without `SafeLoader`
- SSRF-prone XML parsers, XXE risks
- TLS verification disabled, AES in ECB mode
- `dangerouslySetInnerHTML`, raw `.innerHTML =`
- GitHub Actions injection via `${{ github.event.* }}`

If it finds one, it appends a warning right into the tool result. The file still gets written (it doesn't block you), but you get an instant heads-up.

**Pentesting angle:** point Hermes at a client's codebase (with permission, obviously) and ask it to review or refactor files. This plugin passively flags insecure patterns as it goes, basically a free automated code audit layer running in the background of normal work.

```bash
hermes plugins enable security-guidance
```

### Use case 2: Build your own engagement logger plugin (DIY, ~20 lines)
Every real pentest report needs an evidence trail: what command ran, against what target, at what time. Instead of manually copy-pasting your terminal history, write a tiny plugin that hooks into every tool call and logs it automatically.

```python
# ~/.hermes/plugins/pentest-logger/tools.py
import json, time

def on_tool_call(ctx, tool_name, tool_input, **kwargs):
    entry = {
        "time": time.time(),
        "tool": tool_name,
        "input": tool_input,
    }
    with open("engagement_log.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\n")
```

Now every nmap scan, every curl request, every file write during your session gets timestamped automatically. When it's report time, you already have your full evidence log, zero manual work.

### Use case 3: Scope-guard plugin (stops you from scanning the wrong target)
Accidentally scanning something outside your authorized scope is how pentesters get in real trouble. Write a plugin that checks every terminal command against your `scope.txt` allowlist before it's allowed to run:

```python
# ~/.hermes/plugins/scope-guard/tools.py
def before_command(ctx, command, **kwargs):
    with open("scope.txt") as f:
        allowed = [line.strip() for line in f if line.strip()]
    if not any(target in command for target in allowed):
        return {"blocked": True, "reason": "Target not in scope.txt"}
    return {"blocked": False}
```

This turns "oops, wrong IP" into "the plugin just won't let that command run." Cheap insurance for something that could otherwise end an engagement (or get you in legal trouble).

### Use case 4: Attack surface / OAuth scope audit via Composio Connect plugin
Composio Connect links Hermes to 1,000+ SaaS apps through one MCP endpoint with managed OAuth. For pentesting, flip this around: use it on your **own org's** connected apps to map exactly what OAuth scopes and permissions are actually granted across Slack, GitHub, Google Workspace, etc. Great for an internal attack-surface review, you'd be surprised how many apps have way broader permissions than anyone remembers granting.

```
# paste the Composio Hermes connect URL into a chat session
# Hermes walks you through OAuth per app you want audited
```

---

## 6. Cheat sheet & pro tips 💡

- **Everything is disabled by default, on purpose.** If a plugin doesn't seem to work, 90% of the time you just forgot `hermes plugins enable <name>`.
- **`disabled:` in config.yaml always wins**, even over `enabled:`. Useful if you want a hard kill-switch on something without deleting it.
- **User plugins beat built-in ones on name collision.** If you drop a plugin into `~/.hermes/plugins/` with the same name as a built-in one, yours wins, last writer takes it.
- **Hooks vs Tools:** a plugin can add a brand new tool (like a new function Hermes can call) OR just hook into existing events (like logging every message) without adding any visible tool at all. The logger and scope-guard examples above are hooks, they run silently in the background.
- **Restart after changes.** Some plugin config changes need a fresh `hermes` session to actually take effect, same as MCP.
- **Check `/plugins` mid-session** anytime you're not sure what's actually loaded right now vs just sitting in your config.
- **Free doesn't mean unlimited.** If a plugin talks to a third-party API (like Composio for non-trivial usage), that service's own free tier limits still apply, the plugin mechanism itself is free, what it connects to might not be.

---

## Quick command reference

```bash
hermes plugins list              # see all plugins + their state
hermes plugins install NAME      # install a new one
hermes plugins update NAME       # update it
hermes plugins enable NAME       # turn it on
hermes plugins disable NAME      # turn it off
hermes plugins remove NAME       # delete it

# in a live session:
/plugins                          # show currently loaded plugins
```
