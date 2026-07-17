# Hermes Agent — MCP (Model Context Protocol) Guide

> **Official reference:** This guide is checked against the [Hermes MCP documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) and [MCP Configuration Reference](https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference). Refer to them for current connection and filtering behavior.

> MCP is how you give Hermes SUPERPOWERS. Connect external tools — GitHub, Docker, Shodan, Nmap, databases, browsers — and Hermes uses them like built-in tools. This guide covers setup, real use cases, and a curated list of MCP servers for cybersecurity and development.

---

## PART 1: WHAT IS MCP AND WHY YOU NEED IT

### 1.1 The problem MCP solves

Hermes has built-in tools: terminal, file read/write, web search, browser, etc. But what about:

- Managing GitHub repos, issues, and PRs?
- Controlling Docker containers with natural language?
- Querying Shodan for internet-wide recon?
- Checking VirusTotal for malware hashes?
- Accessing databases (PostgreSQL, SQLite)?

You COULD do all of this via the terminal tool (running gh CLI, docker CLI, curl, etc.). But that's messy — Hermes has to parse raw terminal output, handle errors manually, and the experience is fragile.

MCP (Model Context Protocol) is a standard that lets AI agents connect to external tools in a clean, structured way. Instead of:

```
terminal: "gh issue list --repo user/repo --json title,number,state | jq ..."
→ messy JSON parsing, fragile
```

MCP gives Hermes a clean tool like:

```
mcp_github_list_issues(owner="user", repo="repo", state="open")
→ structured response, reliable
```

### 1.2 The mental model

```
Hermes Agent
    │
    ├── Built-in tools (terminal, read_file, web_search, etc.)
    │
    └── MCP Client ←── connects to ──→ MCP Servers
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                     GitHub Server   Docker Server   Shodan Server
                     (gh CLI tools)  (docker tools)  (recon tools)
```

MCP servers run alongside Hermes (as subprocesses or remote HTTP servers). Hermes discovers their tools at startup and makes them available as `mcp_<server>_<tool>` — first-class tools alongside the built-in ones.

---

## PART 2: PREREQUISITES

```bash
# 1. Install the MCP Python SDK (required for Hermes MCP client)
pip install mcp

# 2. For npx-based servers (most community servers)
# Node.js should already be on Kali. If not:
sudo apt install nodejs npm

# 3. For uvx-based servers (Python-based servers)
# uv should already be installed (Hermes uses it)
uv --version
```

Verify:
```bash
python -c "import mcp; print('MCP SDK OK')"
npx --version
uvx --version
```

---

## PART 3: HERMES MCP CLI COMMANDS

```bash
# Catalog-based install (easiest — one command)
hermes mcp install github        # install from Hermes MCP catalog
hermes mcp install docker        # catalog entries have pre-configured manifests

# Manual add
hermes mcp add <name>            # interactive: choose transport, enter command/url

# List all configured servers
hermes mcp list

# Test a server connection
hermes mcp test <name>

# Filter which tools are available per server
hermes mcp configure <name>      # interactive tool picker (TUI)

# Remove a server
hermes mcp remove <name>

# Run Hermes AS an MCP server (expose Hermes to other AI tools)
hermes mcp serve
```

### After adding/removing servers, RESTART Hermes:
```
/reset     # in-session
# OR exit and restart hermes
```

---

## PART 4: HOW MCP WORKS IN HERMES

### 4.1 Startup lifecycle

```
Hermes starts
  ↓
Reads mcp_servers from ~/.hermes/config.yaml
  ↓
For each server: spawns connection in background
  ↓
Calls list_tools() on each server
  ↓
Registers each tool as mcp_{server}_{tool}
  ↓
Injects into ALL platform toolsets (CLI, Telegram, Discord, etc.)
  ↓
Ready — Hermes can call MCP tools like any built-in tool
```

### 4.2 Tool naming convention

```
Server name: github
Tool name: list_issues
→ Registered as: mcp_github_list_issues

Server name: shodan
Tool name: search
→ Registered as: mcp_shodan_search

Server name: my-api
Tool name: fetch.data
→ Registered as: mcp_my_api_fetch_data (dots become underscores)
```

### 4.3 Connection reliability

- Connections are persistent (alive for entire Hermes process)
- Auto-reconnect on drop: up to 5 retries, exponential backoff (1s → 2s → 4s → 8s → 16s, max 60s)
- If all retries fail, Hermes continues without that server (other servers unaffected)

---

## PART 5: CONFIGURATION — THE TWO TRANSPORT TYPES

### 5.1 Stdio transport (command-based, most common)

Hermes launches the MCP server as a subprocess, communicates via stdin/stdout.

```yaml
# ~/.hermes/config.yaml
mcp_servers:
  server_name:
    command: "npx"                    # executable (npx, uvx, python, node, etc.)
    args: ["-y", "package-name"]      # arguments
    env:                              # environment vars (optional)
      API_KEY: "sk-..."
    timeout: 120                      # per-tool-call timeout (default: 120s)
    connect_timeout: 60               # startup timeout (default: 60s)
```

### 5.2 HTTP transport (remote servers)

For servers running on another machine or as a service.

```yaml
mcp_servers:
  server_name:
    url: "https://mcp.example.com/mcp"    # server URL
    headers:                               # HTTP headers
      Authorization: "Bearer sk-..."
    timeout: 180
    connect_timeout: 30
```

**Rule:** A server uses EITHER `command` (stdio) OR `url` (HTTP), not both.

---

## PART 6: REAL-WORLD USE CASES

### 6.1 GitHub MCP Server — Manage repos from Hermes

**What it gives you:** List issues, create PRs, search code, manage repos — all from natural language in Hermes.

**Setup:**
```bash
# Get a GitHub Personal Access Token:
# GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
# Permissions needed: Issues (R/W), Pull requests (R/W), Contents (R)
```

```yaml
# ~/.hermes/config.yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "github_pat_xxxxxxxxxxxx"
    timeout: 60
```

**What you can say to Hermes:**
```
"List all open issues in my TraceixExplorer repo"
"Create a PR for the feature/auth branch with description 'Adds JWT authentication'"
"Search my repos for 'sqlite' to find which projects use SQLite"
"Show me recent commits on main branch of TraceixExplorer"
```

**Tools registered:** `mcp_github_list_issues`, `mcp_github_create_pull_request`, `mcp_github_search_code`, `mcp_github_get_commit`, etc.

---

### 6.2 Docker MCP Server — Control containers with natural language

**What it gives you:** List containers, start/stop, view logs, manage images — all without typing docker CLI.

**Setup:**
```yaml
mcp_servers:
  docker:
    command: "npx"
    args: ["-y", "@thelord/mcp-server-docker-npx"]
    timeout: 30
```

**What you can say:**
```
"Show me all running Docker containers"
"Stop the postgres container"
"Pull the latest Python 3.12 image"
"Show logs for the TraceixExplorer container"
"Prune all unused Docker images"
```

---

### 6.3 Shodan MCP Server — Internet-wide reconnaissance

**What it gives you:** Query Shodan for open ports, services, vulnerabilities on any IP/domain. Essential for pentesting recon.

**Setup:**
```bash
# Get a Shodan API key: https://account.shodan.io (free tier available)
```

```yaml
mcp_servers:
  shodan:
    command: "npx"
    args: ["-y", "mcp-shodan"]
    env:
      SHODAN_API_KEY: "your-shodan-key"
    timeout: 30
```

**What you can say:**
```
"Check Shodan for what's running on 192.168.1.100"
"Search Shodan for Apache servers in India"
"Show me open ports for target.com from Shodan data"
"What vulnerabilities are reported for this IP on Shodan?"
```

---

### 6.4 VirusTotal MCP Server — Threat intelligence

**What it gives you:** Check file hashes, URLs, IPs, and domains against VirusTotal's threat database.

**Setup:**
```bash
# Get a VirusTotal API key: https://www.virustotal.com (free tier available)
```

```yaml
mcp_servers:
  virustotal:
    command: "uvx"
    args: ["mcp-server-virustotal"]
    env:
      VIRUSTOTAL_API_KEY: "your-vt-key"
    timeout: 30
```

**What you can say:**
```
"Check this file hash on VirusTotal: d41d8cd98f00b204e9800998ecf8427e"
"Scan this URL on VirusTotal: http://suspicious-site.com"
"Is this IP address malicious? 45.33.32.156"
```

---

### 6.5 Filesystem MCP Server — Sandboxed file access

**What it gives you:** Read/write files in specific directories. Useful when you want Hermes to only touch certain folders.

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/kali/Coding", "/home/kali/Downloads"]
    timeout: 30
```

This restricts file access to only `/home/kali/Coding` and `/home/kali/Downloads`. Hermes can't touch anything outside those paths via this MCP server.

---

### 6.6 Database MCP Server — PostgreSQL / SQLite

```yaml
# PostgreSQL
mcp_servers:
  postgres:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-postgres"]
    env:
      DATABASE_URL: "postgresql://user:pass@localhost:5432/mydb"

# SQLite
mcp_servers:
  sqlite:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-sqlite"]
    env:
      SQLITE_DB_PATH: "/home/kali/Coding/TraceixExplorer/data.db"
```

**What you can say:**
```
"Show me all tables in the database"
"Query: SELECT * FROM users WHERE created_at > '2026-01-01'"
"What's the schema of the 'scans' table?"
```

---

### 6.7 Putting them all together (your config.yaml)

```yaml
# ~/.hermes/config.yaml — MCP section
mcp_servers:
  # Development
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "github_pat_xxx"
    timeout: 60

  docker:
    command: "npx"
    args: ["-y", "@thelord/mcp-server-docker-npx"]
    timeout: 30

  # Pentesting / Security
  shodan:
    command: "npx"
    args: ["-y", "mcp-shodan"]
    env:
      SHODAN_API_KEY: "xxx"
    timeout: 30

  virustotal:
    command: "uvx"
    args: ["mcp-server-virustotal"]
    env:
      VIRUSTOTAL_API_KEY: "xxx"
    timeout: 30

  # Utility
  time:
    command: "uvx"
    args: ["mcp-server-time"]

  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/kali/Coding"]
    timeout: 30
```

All 6 servers run simultaneously. Hermes has ALL their tools available in every session.

---



# Hermes MCP Guide 
## For MCP servers specifically, you'll also want Node (for npx-based servers) and Docker (for the offensive toolkit below):

```bash
sudo apt update && sudo apt install -y nodejs npm docker.io docker-compose
node --version && npx --version
docker --version
```

MCP itself needs nothing extra, it ships with the standard install.

## Path 1: Easy mode, built-in security skills (no Docker needed) 🥋

Hermes actually ships an official, reviewed **web pentest skill**. It's not just "run nmap", it copies a real methodology (adapted from Shannon, which scored 96.15% on the XBOW benchmark) with actual guardrails baked in:

It's built around three rules: every finding needs reproducible proof, every active request must stay inside a pre-declared scope, and off-scope hosts get refused automatically. Before it runs a single active scan, it makes you confirm in writing that you own or have authorization to test the target.

Install it:

```bash
hermes skills search pentest        # find the exact install ID
hermes skills search domain         # passive recon skill (no API keys needed at all)
hermes skills install <id-from-search>
```

Once installed:

```
/skill web-pentest
```
Then just talk to it: "test staging.mysite.com, I own it, here's scope"

It keeps to conservative nmap settings like -T3 instead of -T4/-T5 to stay stealthier and avoid tripping IDS/IPS, and it explicitly refuses to go beyond port scanning into Metasploit/Cobalt Strike/AD attacks or reverse engineering, those need a dedicated skill or a real pentester.

There's also a **domain-intel** skill: passive domain recon using pure Python, subdomain discovery, SSL cert inspection, WHOIS, DNS records, zero API keys, zero dependencies. Great starting point for OSINT-style research since it needs nothing to install.

## Path 2: Full offensive MCP toolkit (Docker) ⚔️

For the real deal, there's an actual open source MCP pack built for exactly this: **FuzzingLabs/mcp-security-hub**. It's a growing collection of MCP servers that bring offensive security tools to AI assistants, nmap, Ghidra, Nuclei, SQLMap, Hashcat, and more.

What's inside:

| Category | Tools |
|---|---|
| Recon | nmap, shodan, ProjectDiscovery suite, whatweb, masscan, zoomeye |
| Web security | nuclei, sqlmap, nikto, ffuf, burp |
| Binary analysis | radare2, binwalk, yara, capa, ghidra, ida |

Setup:

```bash
git clone https://github.com/FuzzingLabs/mcp-security-hub
cd mcp-security-hub
docker-compose build            # builds all images, do this first
docker-compose up -d nmap-mcp nuclei-mcp sqlmap-mcp ffuf-mcp
```

Now plug it into Hermes. Edit `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  nmap:
    command: "docker"
    args: ["run", "-i", "--rm", "--cap-add=NET_RAW", "nmap-mcp:latest"]
  nuclei:
    command: "docker"
    args: ["run", "-i", "--rm", "nuclei-mcp:latest"]
  sqlmap:
    command: "docker"
    args: ["run", "-i", "--rm", "sqlmap-mcp:latest"]
  ffuf:
    command: "docker"
    args: ["run", "-i", "--rm", "ffuf-mcp:latest"]
```

Then:

```bash
hermes mcp list          # confirm all show "Running"
```
Inside a chat session, run `/reload-mcp` if you added these while Hermes was already open.

Now just talk naturally: "Scan 192.168.1.0/24 for web servers and identify technologies" runs nmap-mcp for ports then whatweb-mcp to fingerprint what's found, or "Check example.com for common vulnerabilities" triggers a nuclei scan across CVEs, exposures, and misconfig templates.

## Full command cheatsheet 📋

```bash
# MCP management
hermes mcp                    # interactive picker, browse + install with Enter
hermes mcp add NAME --command/--url ...   # add manually
hermes mcp add NAME --preset name         # for known servers, no config needed
hermes mcp list                # see what's connected + how many tools
hermes mcp test NAME           # ping-test a specific server
hermes mcp configure NAME      # pick which tools from that server actually show up
hermes mcp remove NAME         # drop a server
hermes mcp serve                # expose Hermes itself as an MCP server to other tools

# Skills
hermes skills search QUERY
hermes skills install ID
hermes skills list
hermes skills uninstall N

# Session slash commands
/reload-mcp        # reload MCP servers after config change
/tools              # toggle built-in tools
/skill NAME         # load a skill into current chat
/yolo               # toggle auto-approve for commands (careful with this one)

# General health
hermes doctor --fix
hermes update
```

## Pro tips nobody bothers explaining 💡

- **Env vars are filtered by default.** Only PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR and XDG_* variables pass through to MCP subprocesses, so your other API keys and secrets don't accidentally leak to a random MCP server. You have to explicitly whitelist a key under `env:` for it to reach that server.
- **Errors get auto-redacted.** If an MCP tool call fails, key-looking strings in the error message get swapped for `[REDACTED]` automatically, so you're not pasting a leaked token into chat by accident.
- **Filter tools per server.** `hermes mcp configure <name>` lets you hide tools you don't need. Less clutter in context = fewer wrong tool picks by the agent.
- **NET_RAW capability matters.** Notice the `--cap-add=NET_RAW` flag on the nmap container? Without it, nmap can't do raw SYN scans, it'll silently fall back to slower connect scans. Don't just copy configs blindly, know what each flag does.
- **`/yolo` skips approval prompts.** Tempting when running recon in bulk, but for anything hitting live infra, keep approvals on so you actually see the exact command before it fires.
- **There IS a hardline blocklist that even yolo can't bypass**, catastrophic stuff like filesystem wipes or fork bombs get blocked no matter what.
- **Read the manifest before installing catalog MCPs**, especially security ones. Nous reviews them, but a compromised upstream package is still a risk vector worth 30 seconds of your time.
- **Docker isolation is your friend here.** Running nmap/sqlmap/nuclei inside containers (like the FuzzingLabs setup does) means a weird payload or crash doesn't touch your actual host.

One honest note, not a lecture, just how the tooling itself is built: the official pentest skill hard-refuses to run without you confirming you own or have written authorization for the target, and that's the right way to use any of this stuff anyway, your own boxes, labs, CTFs, or clients who signed off. Keeps you legal and keeps your findings actually useful instead of getting your IP blacklisted.

Want me to also set up a `scope.txt` template or walk through your first actual scan once you've got the containers up?


## PART 9: THE MCP CATALOG (hermes mcp install)

Hermes has a built-in catalog of pre-configured MCP servers. These are reviewed by the Hermes team and work out of the box:

```bash
# Browse available catalog entries
hermes mcp list --catalog

# Install from catalog (auto-configures everything)
hermes mcp install github
hermes mcp install docker
hermes mcp install postgres
hermes mcp install sqlite
hermes mcp install shodan
hermes mcp install virustotal
hermes mcp install filesystem
hermes mcp install time
hermes mcp install slack
hermes mcp install jira
hermes mcp install confluence
hermes mcp install brave-search

# Catalog install handles:
# - Dependencies (pip install, npm install)
# - Config generation (writes to config.yaml)
# - Tool filtering presets
```

**Catalog vs manual:** Catalog is easier (one command). Manual gives you full control (custom paths, env vars, timeouts). For beginners, always use `hermes mcp install <name>`.

---

## PART 10: MCP AS A SERVER (Expose Hermes to other AI tools)

You can also run Hermes AS an MCP server. This lets other AI tools (Claude Desktop, Cursor IDE, VS Code) use Hermes as a tool.

```bash
hermes mcp serve
# Hermes now exposes its capabilities as MCP tools
# Other AI tools can connect to Hermes and use:
# - terminal execution
# - file operations
# - web search
# - browser automation
# - all MCP tools Hermes is connected to
```

Use case: You're in Cursor IDE. You ask Cursor "research this CVE and set up a test environment." Cursor calls Hermes (via MCP), Hermes runs nmap, checks Shodan, spins up Docker containers, and returns results to Cursor.

---

## QUICK REFERENCE

### CLI Commands
```
Install from catalog         hermes mcp install <name>
Add manually                 hermes mcp add <name>
List configured              hermes mcp list
Test connection              hermes mcp test <name>
Filter tools                 hermes mcp configure <name>
Remove server                hermes mcp remove <name>
Run Hermes as MCP server     hermes mcp serve
```

### Config template
```yaml
mcp_servers:
  name:
    command: "npx"                        # or "uvx", "python", "node"
    args: ["-y", "package-name"]          # server package + args
    env:                                  # env vars for this server only
      API_KEY: "xxx"
    timeout: 120                          # per-tool-call timeout
    connect_timeout: 60                   # startup timeout
```

### For a pentesting student — install today
```bash
pip install mcp                              # prerequisite
hermes mcp install github                    # manage your repos
hermes mcp install docker                    # control containers
hermes mcp install shodan                    # internet recon
hermes mcp install virustotal                # threat intel
hermes mcp install time                      # simple starter (learn how MCP works)
# Restart Hermes: /reset
```

---

## THE "WHY MCP" SUMMARY

Without MCP, asking Hermes to manage GitHub means:
```
terminal(command="gh issue list --repo user/repo --state open --json title,number")
→ raw JSON output → Hermes parses → fragile, breaks on edge cases
```

With MCP:
```
mcp_github_list_issues(owner="user", repo="repo", state="open")
→ structured response → always works, native error handling
```

MCP turns "Hermes fumbling with CLI tools" into "Hermes having native integrations." Install GitHub + Docker + Shodan today. You'll see the difference immediately.
