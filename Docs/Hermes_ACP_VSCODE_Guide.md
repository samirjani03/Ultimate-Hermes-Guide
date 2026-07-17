# Hermes ACP: IDE Integration with VS Code (Beginner Guide)

> **Official reference:** This guide is checked against the [Hermes ACP documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/acp) and [CLI Commands Reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands). Refer to them for current editor integration and command behavior.

---

## 1. What is ACP? (simple version)

**ACP = Agent Client Protocol.**

Think of it like this: LSP (Language Server Protocol) let every editor talk to every programming language the same way, so you didn't need a custom plugin for Python-in-VSCode, Python-in-Vim, Python-in-JetBrains, one implementation worked everywhere.

ACP does the same thing, but for AI agents instead of languages. It's an open standard so **any ACP-compatible editor can talk to any ACP-compatible AI agent**, using the exact same protocol.

Hermes implements the agent side of this. Run `hermes acp` and Hermes becomes a server that VS Code (or Zed, or JetBrains) can plug straight into.

```
VS Code  ──(ACP protocol, JSON-RPC over stdio)──►  hermes acp  ──►  Hermes brain (tools, memory, skills)
```

---

## 2. Why use ACP instead of just the terminal?

| Without ACP | With ACP in VS Code |
|---|---|
| Hermes runs in a separate terminal window | Hermes runs inside your editor |
| You copy-paste code between terminal and files | Hermes edits files directly, you see the diff inline |
| No visual approval for risky commands | Approval prompts show up in the editor UI |
| You lose IDE context (open tabs, selection) | Hermes automatically sees your active file and selection |

Good rule of thumb from the official docs: **keep Copilot for inline autocomplete, use Hermes/ACP for multi-step work** like patching multiple files, running tests, or explaining a diff. They're not competing, they solve different problems.

---

## 3. Before you start: install the ACP extra

If you installed Hermes with the full install script, you already have everything. If you installed a lighter version (without `[all]`), you need one extra step:

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[acp]"
```

Then confirm your model/provider is set up (ACP uses your normal Hermes credentials, it does not have its own separate login):

```bash
hermes model
```

---

## 4. What ACP mode can actually do (and what it can't)

Official docs confirm Hermes runs a **curated toolset** in ACP mode, built specifically for editor workflows:

**Included:**
- `read_file`, `write_file`, `patch`, `search_files`
- Terminal execution (routed through the editor's approval UI)
- All your installed skills and MCP servers still work

**Intentionally excluded:**
- Messaging delivery (Telegram/Discord/Slack sending)
- Cron job management

Makes sense, those don't belong inside an editor session anyway.

**Session behavior worth knowing:**
- ACP sessions are tied to the folder you opened in VS Code (the editor's working directory becomes Hermes' task ID). So always open VS Code **at your repo root**, not a subfolder, or Hermes might read/write in the wrong place.
- Dangerous terminal commands get routed back to VS Code as an approval popup, if you don't respond in time, it denies by default (fails safe, not open).

---

## 5. Setting up VS Code (step by step)

Hermes itself doesn't publish its own VS Code extension, it implements the ACP *server* side. You need an ACP *client* extension in VS Code to talk to it. There are two solid open-source options:

### Option A: "ACP Client" extension (generic, supports many agents)
```
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "ACP Client" (by formulahendry)
4. Install it
5. Open the ACP Client panel from the Activity Bar (look for the ACP icon)
6. Click "+" to add an agent, or pick Hermes from the built-in list if shown
```

If Hermes isn't in the built-in list yet, add it manually in VS Code settings:
```json
{
  "acp.agents": {
    "hermes-agent": {
      "command": "hermes",
      "args": ["acp"]
    }
  }
}
```

### Option B: Dedicated Hermes extension (community-built sidebar just for Hermes)
```
1. Search the VS Code Marketplace for the Hermes-specific ACP extension
2. Install it
3. It spawns "hermes acp" as a local subprocess automatically, no config needed
```

Both options do the same core thing underneath: launch `hermes acp` and speak JSON-RPC to it over stdio. No cloud proxy involved, everything runs locally.

---

## 6. First connection checklist

Before clicking connect in VS Code, run these in a terminal:

```bash
# 1. Confirm hermes is actually reachable on PATH
which hermes

# 2. Confirm your model/provider is configured
hermes model

# 3. Launch VS Code from the SAME shell/venv where hermes works
#    (this matters a lot, a lot of "won't connect" issues are just PATH mismatches)
code .
```

Then in VS Code:
```
1. Open your project folder at the REPO ROOT
2. Open the ACP extension panel
3. Connect / start a new Hermes session
4. Ask it something simple first: "list the files in this repo"
```

If that works, you're good to go for real multi-file work, patches, and test runs.

---

## 7. Windows users, read this

Native Hermes install only supports Linux/macOS/WSL2. **Windows itself needs WSL2.**

```
1. Install WSL2 if you haven't: wsl --install (in PowerShell as admin)
2. Install Hermes inside WSL2 (follow the normal Linux install steps there)
3. In VS Code, install the "WSL" extension
4. Open your project folder through WSL (bottom-left green button → "Connect to WSL")
5. Now install/use the ACP extension as normal, VS Code is now talking to the WSL-side hermes
```

---

## 8. Zed users get one shortcut (bonus, not VS Code, but worth knowing)

Since ACP is an open standard co-developed with Zed, Zed has a built-in registry:
```
1. Click "Add Agent" in Zed (or run the zed: acp registry command)
2. Search "Hermes Agent"
3. Install, start a new external-agent thread
```
Zed's registry launches Hermes via `uvx --from 'hermes-agent[acp]==<version>' hermes-acp`, so you need `uv` installed. VS Code doesn't have this registry yet, that's why the manual extension setup above is needed instead.

---

## 9. Browser tools in ACP mode (optional)

If you want Hermes to be able to browse the web while working in your editor, browser tools need a separate one-time install (they're not part of the core Python package):

```bash
hermes acp --setup-browser              # interactive, warns you it's about 400MB
hermes acp --setup-browser --yes        # skips the confirmation prompt
```

Then reconnect your VS Code ACP session.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| VS Code can't connect at all | Run `hermes acp --check` in a terminal, confirm `hermes` is on PATH for VS Code specifically |
| Browser tools missing | `hermes acp --setup-browser`, then reconnect |
| Hermes edits the wrong files | Make sure VS Code is opened at the repo root, restart the ACP session from there |
| Commands run in wrong environment | Check active Hermes profile, shell PATH, virtualenv, and workspace path |
| Expected autocomplete but got nothing | That's normal, ACP is for agentic multi-step work, keep Copilot for inline completions |
| Approval popup never shows / times out | Check the extension's permission setting, some default to "ask", others to "allow all" |

---

## 11. Full command reference

```bash
# Start Hermes as an ACP server (this is what your editor launches automatically)
hermes acp

# Install the ACP extra if you didn't install with [all]
cd ~/.hermes/hermes-agent && uv pip install -e ".[acp]"

# Set up browser tools for ACP mode
hermes acp --setup-browser
hermes acp --setup-browser --yes

# Diagnose connection issues
hermes acp --check

# Normal provider/model setup (ACP reuses this, no separate login)
hermes model
hermes setup
```

VS Code side (once the ACP Client extension is installed):
```
Ctrl+Shift+P → search "ACP" → connect / new session / view protocol traffic log
```

---

## 12. Pro tips nobody mentions upfront

- **Open the repo root, always.** ACP binds your session's file/terminal access to whatever folder VS Code has open. Open a subfolder by accident and Hermes will act like that subfolder is the whole project.
- **Protocol traffic logging exists.** The generic ACP Client extension can log every raw JSON-RPC message between VS Code and Hermes. Genuinely useful if something's silently failing and you want to see the actual request/response instead of guessing.
- **Approval prompts in ACP are simpler than the CLI's.** Don't expect the exact same fine-grained options you get running `hermes` directly in a terminal, ACP mode trades some granularity for a cleaner editor popup.
- **stdout is reserved for protocol traffic.** If you're debugging and see Hermes logs, they're coming through stderr on purpose, stdout is JSON-RPC only, don't be confused if `print()` debugging in a custom tool doesn't show where you expect.
- **Same credentials as your CLI setup.** If `hermes model` already works in your terminal, ACP mode inherits it automatically, no separate API key entry needed inside VS Code.
- **Skills and MCP servers you already set up still work in ACP mode.** You don't lose any of the offensive security MCP servers or the web-pentest skill from before, they just run inside the editor session now instead of a bare terminal.
