# Hermes Agent — Cron Jobs & Gateway (Telegram) Guide

> **Official reference:** This guide is checked against the [Hermes Cron Jobs documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) and [Messaging Gateway documentation](https://hermes-agent.nousresearch.com/docs/user-guide/messaging). Refer to them for current scheduling and platform behavior.

> Two systems that let Hermes work WITHOUT you being there. Cron jobs = scheduled autonomous tasks (scan this every day, remind me every Monday). Gateway = control Hermes from messaging apps (Telegram on your phone when away from the Kali VM).

---

## PART 1: CRON JOBS

### 1.1 What is a cron job?

A cron job is Hermes running a task on a schedule — autonomously, without you typing anything. You set it once, and Hermes does it forever.

**Mental model:** Like setting an alarm clock for Hermes. "Every morning at 9 AM, scan this target and report findings." "Every Friday, clean up old sessions and export project logs." Hermes wakes up, does the work, and delivers the result to you.

---

### 1.2 Why cron jobs matter for YOU

As a cybersecurity student doing pentesting, coding, and research:

| Use case | Cron job |
|----------|----------|
| Daily vulnerability scan | "Every day at 8 AM, scan target.com for new CVEs" |
| Weekly progress summary | "Every Sunday, summarize my TryHackMe progress from sessions" |
| Docker cleanup | "Every 3 days, prune unused Docker images and containers" |
| Git backup | "Every 6 hours, commit and push all unpushed work" |
| Threat intel monitoring | "Every 12h, check CVEs related to Windows privilege escalation" |
| Lab environment check | "Every morning, verify my Kali VM services are running" |
| Memory backup | "Every Monday, export my Hermes memory to a backup file" |

---

### 1.3 CLI commands

```bash
# See what jobs exist
hermes cron list              # active jobs only
hermes cron list --all        # including disabled/paused

# Create a new job
hermes cron create "30m"      # run every 30 minutes (interactive prompt follows)

# Edit a job
hermes cron edit <job-id>     # change schedule, prompt, delivery

# Control job state
hermes cron pause <job-id>    # temporarily stop
hermes cron resume <job-id>   # restart paused job
hermes cron run <job-id>      # trigger NOW (doesn't affect schedule)

# Delete a job
hermes cron remove <job-id>   # permanently delete

# Scheduler status
hermes cron status            # is the scheduler running?
```

---

### 1.4 Schedule formats (5 ways to set when)

```bash
# Format 1: Duration (simplest)
"30m"              # every 30 minutes
"2h"               # every 2 hours
"6h"               # every 6 hours
"1d"               # every day

# Format 2: "every" phrase (human-readable)
"every monday 9am"
"every day at midnight"
"every 6 hours"
"every friday 5pm"

# Format 3: 5-field cron (classic Linux cron)
"0 9 * * *"        # every day at 9:00 AM
"0 */6 * * *"      # every 6 hours
"0 9 * * 1"        # every Monday at 9:00 AM
"0 8,20 * * *"     # every day at 8 AM and 8 PM

# Format 4: ISO timestamp (one-shot — runs once and done)
"2026-07-15T09:00:00"    # run once on July 15, 2026 at 9 AM

# Format 5: With repeat count
hermes cron create "30m" --repeat 5     # run every 30 min, only 5 times
```

**Which to use:** Start with "every" phrases. They're the easiest to read and write. Only use 5-field cron if you need something specific like "every other Wednesday at 3 AM."

---

### 1.5 Creating a cron job (step by step)

```bash
# Step 1: Create with schedule
hermes cron create "every day at 9am"

# Step 2: It opens an interactive prompt. Write the task:
"Scan my GitHub repos for dependency vulnerabilities. 
Check requirements.txt and package.json files across all projects.
Summarize findings in a short report."

# Step 3: Set delivery
# Hermes asks where to deliver results. Options:
#   - This terminal (origin)
#   - Telegram DM
#   - Discord channel
#   - Just save locally (no delivery

# Step 4: Add skills (optional)
# "Load the github-code-review skill for this job"

# Done! Hermes shows the job ID and next run time.
```

---

### 1.6 Per-job options (advanced knobs)

When creating or editing a job, you can configure:

| Option | What it does | Example |
|--------|-------------|---------|
| `--skills` | Pre-load skills for this job | `--skills github-code-review,traceix-api-integration` |
| `--model` | Override model for this job only | `--model anthropic/claude-sonnet-4` |
| `--workdir` | Run in a specific project directory | `--workdir /home/kali/Coding/TraceixExplorer` |
| `--script` | Run a shell/Python script BEFORE the agent (data collection) | `--script check_services.sh` |
| `--no-agent` | Skip the LLM entirely — just run the script | `--no-agent --script health_check.sh` |
| `--context-from` | Feed output of job A into job B | `--context-from <other-job-id>` |
| `--deliver` | Where to send results | `--deliver telegram` |

---

### 1.7 Script mode — no LLM, just commands

For simple monitoring/checking where you don't need AI:

```bash
# Create a watchdog script
cat > ~/.hermes/scripts/health_check.sh << 'EOF'
#!/bin/bash
# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️ Docker is DOWN on Kali VM"
else
    echo "✅ Docker: running ($(docker ps -q | wc -l) containers)"
fi
# Check disk space
DISK=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK" -gt 85 ]; then
    echo "⚠️ Disk usage: ${DISK}%"
fi
EOF
chmod +x ~/.hermes/scripts/health_check.sh

# Create a script-only cron job (zero token cost)
hermes cron create "every 6h" \
  --script health_check.sh \
  --no-agent \
  --deliver telegram \
  --name "Kali VM Health Check"
```

**Script-only jobs (no_agent=true):**
- Zero LLM cost (no tokens burned)
- stdout IS the message delivered to you
- empty stdout = SILENT (nothing sent — perfect for "alert only when broken")
- non-zero exit = auto-alert (error sent regardless)
- Scripts in `~/.hermes/scripts/`: `.sh`/`.bash` run via bash, everything else via Python

---

### 1.8 Chaining jobs (context_from)

Job A collects data, Job B processes it:

```bash
# Job A: Collect CVE data every 6 hours
hermes cron create "every 6h" \
  --name "CVE Collector" \
  --prompt "Search for new Windows privilege escalation CVEs. Save to ~/research/cves.md"

# Job B: Analyze collected data daily
hermes cron create "0 9 * * *" \
  --name "CVE Analyzer" \
  --context-from <job-a-id> \
  --prompt "Review the collected CVEs. Prioritize by severity. Draft an actionable report."
```

---

### 1.9 delivery options

```bash
--deliver origin           # back to this terminal (default)
--deliver telegram         # to your connected Telegram
--deliver discord          # to Discord channel
--deliver local            # save only, don't send
--deliver all              # every connected platform
--deliver telegram,discord # multiple platforms
```

**For a single user:** `--deliver telegram` is the power move. Get cron job results on your phone, wherever you are.

---

### 1.10 In-session cron management

```
/cron                    # interactive cron manager (TUI)
```

During a Hermes chat session, type `/cron` to manage jobs without leaving the conversation.

---

### 1.11 Cron job safety rules

1. **3-minute hard interrupt per run** — no job runs forever. If it takes too long, it gets killed.
2. **`.tick.lock` prevents duplicates** — if a job is still running when the next tick fires, it's skipped.
3. **Cron sessions are isolated** — they don't see your current chat context. The prompt must be self-contained.
4. **Cron jobs cannot ask questions** — no `clarify()` tool. They must be fully autonomous.
5. **Cron jobs should NOT schedule more cron jobs** — no recursion.

---

### 1.12 Practical cron job recipes for you

```bash
# 1. Daily CVE monitor (pentesting)
hermes cron create "every day at 9am" \
  --name "Daily CVE Check" \
  --prompt "Search for new CVEs related to: Windows privilege escalation, Active Directory, Linux kernel, Docker escape. Summarize top 3 most critical with exploit availability. Save to ~/research/daily-cves/$(date +%Y-%m-%d).md" \
  --deliver telegram

# 2. Weekly TryHackMe progress report
hermes cron create "every sunday at 8pm" \
  --name "Weekly THM Report" \
  --prompt "Review my sessions from this week. What TryHackMe rooms did I work on? What new techniques did I learn? What should I focus on next week? Check session_search for 'THM' and 'TryHackMe'." \
  --deliver telegram

# 3. Docker cleanup every 3 days
hermes cron create "every 3 days" \
  --name "Docker Cleanup" \
  --script docker_cleanup.sh \
  --no-agent

# 4. Git backup every 6 hours
hermes cron create "every 6h" \
  --name "Git Auto-Commit" \
  --prompt "Check all git repos in ~/Coding/ for uncommitted changes. Commit and push any pending work with descriptive commit messages. Report what was pushed." \
  --deliver local

# 5. Memory backup every Monday
hermes cron create "every monday 9am" \
  --name "Memory Backup" \
  --prompt "Export my current Hermes memory to ~/backups/memory-$(date +%Y-%m-%d).md. Include a summary of what's stored and what's near the budget limit."
```

---

### 1.13 Cron job quick reference

```
GOAL                                    COMMAND
──────────────────────────────────────────────────────────────────
List active jobs                        hermes cron list
List all (including paused)             hermes cron list --all
Create new job                          hermes cron create "every day at 9am"
Pause a job                             hermes cron pause <id>
Resume a job                            hermes cron resume <id>
Run job NOW (manual trigger)            hermes cron run <id>
Edit job prompt/schedule                hermes cron edit <id>
Delete a job                            hermes cron remove <id>
Scheduler health                        hermes cron status
Manage in-session                       /cron
```

---

## PART 2: GATEWAY (Telegram Setup)

### 2.1 What is the gateway?

The gateway is Hermes's messaging bridge. It connects Hermes to messaging platforms (Telegram, Discord, WhatsApp, Slack, etc.) so you can talk to Hermes from ANY device, not just the terminal.

**Mental model:** The gateway is like giving Hermes a phone number. You text Hermes from your phone → Hermes runs tools on your Kali VM → responds back to your phone. Even when you're in class, at a cafe, or your laptop is closed but the VM is running.

---

### 2.2 Supported platforms (20+)

Telegram, Discord, Slack, WhatsApp, iMessage, Signal, Email, SMS, Matrix, Mattermost, Microsoft Teams, LINE, SimpleX, ntfy, Google Chat, Home Assistant, DingTalk, Feishu, WeCom, WeChat, and more.

**For you:** Telegram is the best choice. Free, fast, excellent bot API, works everywhere.

---

### 2.3 How the gateway works

```
Your Phone (Telegram)                Kali VM (Hermes)
─────────────────────                ─────────────────
You: "Scan 10.10.10.5"  ──Telegram──→ Gateway receives message
                                      Gateway starts Hermes session
                                      Hermes runs: nmap -sV 10.10.10.5
Hermes: "Results: 3 ports..." ←──Telegram── Gateway sends response back
```

The gateway runs as a background service on your Kali VM. It listens for messages 24/7. When you send a message, it spawns a Hermes session with full tool access — same as terminal Hermes.

---

### 2.4 Prerequisites for Telegram

1. A Telegram account (you have one: @Skullcrusher0366)
2. A Telegram bot token (free, created via @BotFather)
3. Your Kali VM must be running (Hermes runs inside it)
4. Internet connection on the VM

---

### 2.5 Step-by-step Telegram setup

**Step 1: Create a Telegram bot**

Open Telegram on your phone or desktop. Message @BotFather:

```
You: /newbot
BotFather: Alright, a new bot. How shall we call it?
You: Skullcrusher Hermes
BotFather: Good. Now choose a username for your bot.
You: skullcrusher_hermes_bot
BotFather: Done! Here is your token:
          7123456789:AAHxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
          Keep this token safe!
```

Copy that token.

**Step 2: Configure Hermes gateway**

```bash
# Start the setup wizard
hermes gateway setup

# Select "Telegram" from the platform list
# Paste your bot token when prompted
# Hermes auto-configures everything else
```

**Step 3: Start the gateway**

```bash
# Start in foreground (see logs, Ctrl+C to stop)
hermes gateway run

# OR: Install as background service (survives terminal close)
hermes gateway install
hermes gateway start

# Check it's running
hermes gateway status
```

**Step 4: Test it**

Open Telegram, find your bot (@skullcrusher_hermes_bot), and send:

```
/status
```

If Hermes responds with session info, it's working.

---

### 2.6 Gateway CLI commands

```bash
hermes gateway run          # Run foreground (testing/debugging)
hermes gateway install      # Install as systemd background service
hermes gateway start        # Start the service
hermes gateway stop         # Stop the service
hermes gateway restart      # Restart the service
hermes gateway status       # Check if running
hermes gateway setup        # Configure platforms (interactive)
```

---

### 2.7 Gateway slash commands (type in Telegram)

| Command | What it does |
|---------|-------------|
| `/new` or `/reset` | Start fresh session |
| `/model <name>` | Switch model |
| `/yolo` | Toggle approval bypass |
| `/status` | Session info |
| `/usage` | Token usage |
| `/stop` | Kill background processes |
| `/title <name>` | Name this session |
| `/sethome` | Set current chat as your home channel |
| `/approve` | Approve a pending dangerous command |
| `/deny` | Deny a pending command |
| `/restart` | Restart the gateway service |
| `/update` | Update Hermes to latest version |
| `/platforms` or `/gateway` | Show connected platforms |
| `/topic` | Manage Telegram topic sessions |
| `/help` | Show all commands |
| `/quit` | End session |

---

### 2.8 Making the gateway survive reboots

```bash
# Install as a user systemd service
hermes gateway install

# Enable auto-start on boot
systemctl --user enable hermes-gateway

# If using WSL2, add to /etc/wsl.conf:
# [boot]
# systemd=true

# For SSH sessions that close, enable linger:
sudo loginctl enable-linger $USER
```

Without linger, the gateway dies when you log out of SSH. With linger, it keeps running.

---

### 2.9 Security considerations

**Who can talk to your bot?** By default, ANYONE who finds your bot username can message it. You need to lock it down.

```bash
# Hermes has a pairing system:
hermes pairing list         # see pending authorization requests
hermes pairing approve <id> # allow a user
hermes pairing revoke <id>  # block a user
```

**Best practices:**
- Only approve YOUR Telegram user ID
- Keep your bot token secret (it's in `~/.hermes/.env`)
- Use `/sethome` to mark your chat as the trusted home channel
- Gateway runs as your user — same permissions as terminal Hermes

---

### 2.10 Real workflow: Pentesting from your phone

```
Scenario: You're in class, but your Kali VM is running at home.

Phone (Telegram):
  "Run a full port scan on the TryHackMe target 10.10.45.100"

Hermes (on Kali VM):
  nmap -p- -sV 10.10.45.100 (background, notify on complete)
  ... 8 minutes later ...
  "Scan complete. Open ports: 22/SSH, 80/HTTP (Apache 2.4.41), 8080/Tomcat.
   HTTP server has a /admin panel. Want me to enumerate it?"

Phone:
  "Yes, run gobuster on /admin and check for default Tomcat creds"

Hermes:
  gobuster dir -u http://10.10.45.100/admin ...
  "Found: /admin/backup, /admin/upload, /admin/config.
   Default Tomcat creds (tomcat:tomcat) work on :8080."
```

You're doing recon from your phone while sitting in a lecture. That's the gateway.

---

### 2.11 Troubleshooting

```bash
# "Gateway not responding"
hermes gateway status
systemctl --user status hermes-gateway

# Check logs
tail -50 ~/.hermes/logs/gateway.log
grep -i "error\|failed" ~/.hermes/logs/gateway.log | tail -20

# "Telegram bot not replying"
# 1. Did you /start the bot on Telegram?
# 2. Check token is correct: grep TELEGRAM ~/.hermes/.env
# 3. Restart: hermes gateway restart

# "Gateway dies when I close terminal"
sudo loginctl enable-linger $USER
hermes gateway install
systemctl --user enable hermes-gateway

# "Gateway crash loop"
systemctl --user reset-failed hermes-gateway
hermes gateway start

# "WSL2 gateway dies on laptop close"
# Add to /etc/wsl.conf: [boot] systemd=true
```

---

## PART 3: PUTTING THEM TOGETHER

### The ultimate workflow: Cron + Gateway

```bash
# 1. Set up Telegram gateway (do once)
hermes gateway setup      # configure Telegram bot
hermes gateway install    # install as service
hermes gateway start      # start it

# 2. Create cron jobs that deliver to Telegram
hermes cron create "every day at 9am" \
  --name "Morning Brief" \
  --prompt "Check for new CVEs in my research areas. Summarize top 3." \
  --deliver telegram

hermes cron create "every monday 9am" \
  --name "Weekly Goals" \
  --prompt "Review last week's sessions. What progress on OSCP prep? What should I focus on this week?" \
  --deliver telegram

# 3. Now every morning, your phone buzzes with:
#    "Morning Brief: 3 new Windows PrivEsc CVEs worth checking..."
#    Reply to the bot to dig deeper — Hermes has full access to your Kali tools.
```

---

## QUICK REFERENCE

### Cron Jobs
```
List jobs               hermes cron list
Create                  hermes cron create "every day at 9am"
Pause                   hermes cron pause <id>
Resume                  hermes cron resume <id>
Run now                 hermes cron run <id>
Edit                    hermes cron edit <id>
Delete                  hermes cron remove <id>
Status                  hermes cron status
In-session              /cron
```

### Gateway
```
Setup platforms         hermes gateway setup
Run foreground          hermes gateway run
Install service         hermes gateway install
Start/stop/restart      hermes gateway start|stop|restart
Check status            hermes gateway status
Approve user            hermes pairing approve <id>
In-chat commands        /status, /model, /yolo, /help, /new, /sethome
```

### Schedule formats
```
Every 30 min            "30m"
Every 6 hours           "every 6h"
Daily at 9 AM           "every day at 9am"  OR  "0 9 * * *"
Every Monday            "every monday 9am"  OR  "0 9 * * 1"
One-shot                "2026-07-15T09:00:00"
Limited repeats         add: --repeat 5
```

---

That's the full picture. Set up Telegram gateway first (15 minutes, free). Then add 2-3 cron jobs that deliver to Telegram. Your phone becomes a remote control for your Kali VM with Hermes as the engine.
