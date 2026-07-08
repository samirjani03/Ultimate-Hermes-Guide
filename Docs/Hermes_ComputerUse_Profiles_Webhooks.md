# Hermes Agent — Computer Use, Profiles & Webhooks

> Three power tools: drive GUI apps without touching your mouse, run isolated Hermes instances per project, and trigger Hermes from GitHub/CI/CD automatically.

---

## PART 1: COMPUTER USE — Drive GUI Tools

### 1.1 What it is

Hermes can see your screen, click buttons, type text, and scroll — all in the BACKGROUND. Your mouse and keyboard stay free. Hermes drives GUI apps (Burp Suite, Firefox, Wireshark) like a ghost.

```
Your mouse → free (you keep working)
Hermes → drives GUI apps in background via virtual cursor
```

### 1.2 Prerequisites

```bash
# The cua-driver must be installed (should come with Hermes)
# Check if it's working:
hermes computer-use doctor
# If broken, it tells you exactly what to fix (permissions, display server, accessibility)
```

### 1.3 How it works — the flow

```
Step 1: Hermes captures screenshot (with numbered overlays on every clickable element)
Step 2: Hermes clicks element #14 (the "Scan" button in Burp Suite)
Step 3: Hermes re-captures to verify the action worked
Step 4: Hermes types text into element #7 (the target input field)
Step 5: Hermes captures again — done
```

### 1.4 Key actions Hermes can do

| Action | What it does | Example use |
|--------|-------------|-------------|
| `capture` | Take screenshot with numbered elements | See what's on screen |
| `click` | Click element by number | Click "Start Attack" in Burp |
| `double_click` | Double-click | Open files, select words |
| `right_click` | Right-click context menu | Burp "Send to Repeater" |
| `type` | Type text into field | Enter target URL, payload |
| `key` | Press key combo | Ctrl+Enter, Ctrl+S |
| `scroll` | Scroll up/down | Long pages, lists |
| `drag` | Drag from A to B | Reorder items |
| `set_value` | Set dropdown/slider value | Select option from menu |
| `wait` | Wait N seconds | Let page load, tool process |
| `focus_app` | Focus a specific app | Switch to Burp Suite |
| `list_apps` | List running applications | Find what's open |

### 1.5 Capture modes

```
mode='som'     → screenshot with numbered overlays (DEFAULT, best for clicking)
mode='vision'  → plain screenshot (no numbers)
mode='ax'      → accessibility tree only (text-based, no image)
```

Always use `som` mode — it numbers every interactable element so Hermes clicks by number, not pixel guessing.

### 1.6 Practical patterns

**Pattern 1: Open Burp Suite and start intercepting**
```
You: "Open Burp Suite, go to Proxy tab, turn intercept ON, 
     then open Firefox and navigate to http://testphp.vulnweb.com"

Hermes:
  capture() → sees desktop
  click element for Burp icon in taskbar
  capture() → sees Burp window
  click "Proxy" tab
  click "Intercept is off" button → turns ON
  click Firefox icon
  type "http://testphp.vulnweb.com" in address bar
  key "Enter"
  capture() → shows the site loaded
```

**Pattern 2: Configure Wireshark capture**
```
You: "Open Wireshark, select eth0 interface, start capture, 
     then I'll generate traffic from a terminal"

Hermes:
  capture() → sees desktop
  click Wireshark icon
  capture() → sees Wireshark window
  double_click "eth0" interface
  capture() → capture is running
  "Ready. Generate your traffic now."
```

**Pattern 3: Use Firefox for web app testing**
```
You: "Open Firefox, go to http://10.10.10.100/admin, 
     try login with admin:admin, take a screenshot of the result"

Hermes:
  focus_app("Firefox")
  capture(mode='som', app='Firefox')
  click address bar element
  type "http://10.10.10.100/admin"
  key "Enter"
  wait(2)
  capture() → sees login form
  click username field
  type "admin"
  click password field
  type "admin"
  click "Login" button
  wait(2)
  capture() → shows login result
```

### 1.7 Important safety rules

```
❌ Hermes will NOT click:    Permission dialogs, password prompts, payment UI
✅ Hermes WILL click:        App buttons, tabs, menus, links, input fields
```

- Hermes sees the accessibility tree (AX tree) — buttons, inputs, menus, tabs. It can click anything labeled.
- Background mode: your cursor stays free. Hermes's cursor is a tinted overlay — visual feedback only.
- `focus_app` with `raise_window=false` (default): Hermes drives the app WITHOUT bringing its window to front. Your screen stays on what you're doing.

### 1.8 Troubleshooting

```bash
# If captures are empty or clicks don't land:
hermes computer-use doctor

# Common fixes:
# Linux: Install AT-SPI2 for accessibility tree
sudo apt install at-spi2-core

# Check if cua-driver is running
ps aux | grep cua-driver
```

---

## PART 2: PROFILES — Isolated Hermes Instances

### 2.1 What profiles solve

Without profiles, all your work bleeds together: CTF tools mixed with study notes, work project memory mixed with personal chats.

```
Default (no profiles):      Everything in one bucket
With profiles:              Each project = its own Hermes brain
```

Each profile has its own:
- Memory (USER.md + MEMORY.md)
- Skills (different tools per project)
- Config (different models, toolsets)
- Cron jobs (scheduled tasks per project)
- Session history (study sessions don't appear in work sessions)

### 2.2 CLI commands

```bash
# List all profiles
hermes profile list

# Create a new profile
hermes profile create study
hermes profile create work
hermes profile create ctf

# Create from existing (clone settings)
hermes profile create pentest --clone-from default     # copy default config
hermes profile create work --clone                     # same as --clone-from default

# Set which profile to use by default
hermes profile use study

# Start Hermes with a specific profile
hermes --profile ctf
hermes --profile work --continue

# Show profile details
hermes profile show ctf

# Rename a profile
hermes profile rename ctf bugbounty

# Delete a profile
hermes profile delete old-project

# Export profile (backup/share)
hermes profile export ctf    → creates ctf.tar.gz

# Import from backup
hermes profile import ~/backups/ctf.tar.gz

# Create a wrapper script (hermes-ctf command)
hermes profile alias ctf     → creates `hermes-ctf` command
```

### 2.3 Your profile setup (recommended)

```bash
# Create 4 profiles
hermes profile create study        # TryHackMe, courses, learning
hermes profile create ctf          # CTF challenges, labs
hermes profile create dev          # Coding projects (TraceixExplorer, etc.)
hermes profile create research     # CVE research, threat intel

# Each gets its own memory, skills, and tools
# Start with: hermes --profile study
```

### 2.4 Profile structure on disk

```
~/.hermes/profiles/ctf/
├── config.yaml             # Profile-specific config
├── .env                    # Profile-specific secrets
├── skills/                 # CTF-specific skills
├── plugins/                # CTF-specific plugins
├── cron/                   # CTF-specific scheduled jobs
└── memories/               # CTF-specific memory files
```

### 2.5 Practical profile uses

```
Profile         Skills loaded           Cron jobs              Gateway
─────────────────────────────────────────────────────────────────────────
study           thm-progress, learning   Daily THM reminder     Telegram
ctf             recon-pipeline, exploit  None                   Off
dev             github, docker           Git backup every 6h    Off
research        cve-search, shodan       Daily CVE check 9 AM   Telegram
```

```bash
# Morning study session
hermes --profile study
"Continue the TryHackMe room from yesterday"

# Afternoon CTF
hermes --profile ctf
"Start recon on the CTF target 10.10.99.100"

# Evening coding
hermes --profile dev --continue
"Work on the TraceixExplorer search feature"
```

---

## PART 3: WEBHOOKS — Trigger Hermes Automatically

### 3.1 What webhooks do

External services (GitHub, GitLab, CI/CD, monitoring) can POST events to a URL. Hermes receives them and runs an agent to handle them.

```
GitHub: new issue created
    ↓ POST to Hermes webhook URL
Hermes: "New issue: 'Fix auth bug' — triaging now..."
    ↓ runs agent with issue context
Hermes: reports back via Telegram/Discord/terminal
```

### 3.2 Setup (one time)

```bash
# Check if webhook platform is enabled
hermes webhook list

# If not enabled, set it up:
hermes gateway setup         # interactive → enable webhooks → set port → set secret
# OR manual:
hermes config set platforms.webhook.enabled true
hermes config set platforms.webhook.extra.port 8644
hermes config set platforms.webhook.extra.secret "generate-a-strong-random-secret"

# Start/restart gateway
hermes gateway restart

# Verify
curl http://localhost:8644/health
# → {"status": "ok"}
```

### 3.3 Creating webhook subscriptions

```bash
# GitHub: new issues
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New GitHub issue #{issue.number}: {issue.title}\nAction: {action}\nAuthor: {issue.user.login}\nBody:\n{issue.body}\n\nPlease triage this issue. Label it, assess priority, and suggest an approach." \
  --deliver telegram

# GitHub: new PRs (with code review)
hermes webhook subscribe github-prs \
  --events "pull_request" \
  --prompt "PR #{pull_request.number}: {pull_request.title}\nBy: {pull_request.user.login}\nBranch: {pull_request.head.ref} → {pull_request.base.ref}\n\n{pull_request.body}\n\nReview this PR for security issues and code quality." \
  --skills "github-code-review" \
  --deliver telegram

# Generic: CI/CD build notifications
hermes webhook subscribe ci-builds \
  --events "pipeline" \
  --prompt "Build {object_attributes.status} on {project.name} branch {object_attributes.ref}\nCommit: {commit.message}\n\nIf failed, analyze the error and suggest a fix." \
  --deliver telegram

# Zero-cost: direct delivery (no LLM)
hermes webhook subscribe alerts \
  --deliver telegram \
  --deliver-only \
  --prompt "🚨 Alert: {alert.name}\nSeverity: {alert.severity}\n{alert.message}" \
  --description "Forward monitoring alerts directly, no agent processing"
```

### 3.4 Managing webhooks

```bash
# List all subscriptions
hermes webhook list

# Shows: name, URL, events, delivery target, secret (masked)

# Test a subscription
hermes webhook test github-issues
hermes webhook test github-issues --payload '{"issue": {"number": 42, "title": "Test"}}'

# Remove a subscription
hermes webhook remove github-issues
```

### 3.5 Prompt templates — the {dot.notation} syntax

Access any field from the incoming JSON payload:

```
{issue.title}                    → GitHub issue title
{pull_request.user.login}        → PR author username
{data.object.amount}             → Stripe payment amount
{commit.message}                 → GitLab/GitHub commit message
{alert.name}                     → Monitoring alert name
```

If no prompt is set, the full JSON payload is dumped into the agent prompt.

### 3.6 Connecting GitHub (example flow)

```bash
# 1. Create webhook in Hermes
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New issue #{issue.number}: {issue.title} by {issue.user.login}\n{issue.body}" \
  --deliver telegram

# Hermes returns:
# URL: http://YOUR_VM_IP:8644/webhooks/github-issues
# Secret: hm_xxxxxxxxxxxx

# 2. In GitHub repo → Settings → Webhooks → Add webhook
#    Payload URL: http://YOUR_VM_IP:8644/webhooks/github-issues
#    Content type: application/json
#    Secret: hm_xxxxxxxxxxxx
#    Events: Issues

# 3. Create a test issue in GitHub
#    Hermes receives it → triages → sends result to Telegram
```

**Note:** For GitHub to reach your Kali VM, the VM needs a public IP or a tunnel (ngrok, cloudflared):
```bash
# Expose local port 8644 publicly
ngrok http 8644
# Use the ngrok URL in GitHub webhook settings
```

### 3.7 Security

- Each subscription gets an auto-generated HMAC-SHA256 secret
- Hermes validates signatures on every incoming POST
- Static routes can't be overwritten by dynamic subscriptions
- Subscriptions persist to `~/.hermes/webhook_subscriptions.json`

---

## QUICK REFERENCE

### Computer Use
```
Take screenshot              capture(mode='som', app='Firefox')
Click element #14            click(element=14)
Type text                    type(text="admin")
Press Enter                  key(keys="Enter")
Scroll down                  scroll(direction='down', amount=3)
Wait for load                wait(seconds=2)
See running apps             list_apps()
Focus app (background)       focus_app('Burp Suite')
Health check                 hermes computer-use doctor
```

### Profiles
```
List                        hermes profile list
Create                      hermes profile create <name>
Use as default              hermes profile use <name>
Start with profile          hermes --profile <name>
Clone existing              hermes profile create <name> --clone
Show details                hermes profile show <name>
Rename                      hermes profile rename <old> <new>
Export/backup               hermes profile export <name>
Import                      hermes profile import <file>
Delete                      hermes profile delete <name>
Create alias command        hermes profile alias <name>
```

### Webhooks
```
Setup                       hermes gateway setup (enable webhooks)
List subscriptions          hermes webhook list
Create subscription         hermes webhook subscribe <name> --events "..." --prompt "..."
Test subscription           hermes webhook test <name>
Remove subscription         hermes webhook remove <name>
Health check                curl http://localhost:8644/health
```

---

## FINAL WORD — Your Complete Hermes Library

| # | Guide | Use it for |
|---|-------|------------|
| 1 | Sessions | Never lose work, resume anything |
| 2 | CLI/TUI + Terminal | Daily driving, Docker, builds, nmap |
| 3 | Skills + Context + Memory | Hermes learns YOUR workflows |
| 4 | Memory (Mem0) | Semantic long-term memory |
| 5 | Cron + Gateway | Autonomous work + phone control |
| 6 | MCP | Connect GitHub, Shodan, Docker natively |
| 7 | Plugins | Build your own tools, slash commands |
| 8 | Delegation | Parallel work — scan + research + code |
| 9 | **Computer Use + Profiles + Webhooks** | GUI tools, project isolation, auto-triggers |

9 guides. The full Hermes ecosystem. From beginner to power user. You're ready.
