# Hermes Agent — Delegation (Subagents) Guide

> **Official reference:** This guide is checked against the [Hermes Delegation documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation) and [Delegation Patterns guide](https://hermes-agent.nousresearch.com/docs/guides/delegation-patterns). Refer to them for current subagent behavior and patterns.

> Delegation = Hermes clones itself to work on MULTIPLE things at the SAME TIME. One agent scans the target, another researches the CVE, a third writes your report. All in parallel. You just keep talking to the main Hermes.

---

## PART 1: WHAT IS DELEGATION?

### 1.1 The problem it solves

Without delegation:
```
You: "Scan 10.10.10.5, research CVE-2024-1234, and write a report"

Hermes:
  1. Runs nmap (3 minutes)
  2. Researches CVE (2 minutes)
  3. Writes report (1 minute)
  Total: 6 minutes — ONE thing at a time
```

With delegation:
```
You: "Scan 10.10.10.5, research CVE-2024-1234, and write a report"

Hermes spawns 3 subagents simultaneously:
  Agent A: nmap scan       (3 min)  ┐
  Agent B: CVE research    (2 min)  ├── All running in PARALLEL
  Agent C: Write report    (1 min)  ┘
  Total: 3 minutes — THREE things at once
```

Each subagent gets its own terminal session, its own tools, its own context. They work independently. Results come back to you as separate messages.

### 1.2 When to delegate vs other methods

| Method | Use for | Best at |
|--------|---------|---------|
| **delegate_task** | Parallel independent tasks | Multi-tasking, research sprints |
| **terminal (background)** | Long shell commands | Builds, nmap full scans, servers |
| **cron job** | Scheduled recurring work | Daily reports, monitoring |
| **/background (slash)** | Quick async prompt | "Summarize this while I read code" |

**Rule:** If tasks are INDEPENDENT (don't need each other's results) → delegate. If one needs the other's output first → do sequentially yourself.

---

## PART 2: HOW DELEGATION WORKS (Simple)

### 2.1 The flow

```
You tell Hermes: "Research X, and also build Y"

Hermes calls: delegate_task(tasks=[
  {goal: "Research X", context: "..."},
  {goal: "Build Y", context: "..."}
])

Two subagents spawn → work in background → finish → results appear in chat

You keep talking to Hermes while they work. No waiting.
```

### 2.2 Subagent limitations (what they CAN'T do)

Subagents are workers. They CANNOT:
- Ask you questions (no `/clarify` tool)
- Access your session memory (fresh context only)
- Delegate further (leaf agents are workers only)
- See your conversation history

**This means:** You MUST give them everything they need in the `context` field. Paths, commands, instructions, constraints — pack it all in there.

---

## PART 3: SINGLE DELEGATION — One Task, One Agent

### 3.1 How you ask Hermes (natural language)

You don't type Python code. You just tell Hermes what to delegate:

```
"Research CVE-2024-6387 (regreSSHion). Find the exploitation vector, affected OpenSSH versions, and any public PoCs. Save findings to ~/research/cve-2024-6387.md"
```

Hermes sees this is a self-contained research task and delegates it:

```
→ delegate_task(
    goal="Research CVE-2024-6387...",
    context="Save to ~/research/cve-2024-6387.md. Find exploitation vector, affected versions, PoCs."
  )
```

Subagent works. Result appears as a new message when done.

### 3.2 What to include in context

When Hermes delegates, it packages context for the subagent. You can be explicit:

```
"Delegate this task: Research all Windows privilege escalation techniques 
from HackTricks. Focus on: service misconfigurations, unquoted service paths, 
alwaysInstallElevated. Save to ~/research/windows-privesc-techniques.md.

CONTEXT FOR SUBAGENT:
- Working directory: /home/kali/research
- Use web_search and web_extract for research
- Format output as markdown with tool names and commands
- Do NOT run any actual exploits, research only"
```

The more specific the context, the better the subagent performs.

---

## PART 4: BATCH DELEGATION — Multiple Agents, Same Time

### 4.1 The "scatter and gather" pattern

```
You: "I need three things done in parallel:
  1. Full nmap scan on 10.10.10.5
  2. Research all CVEs for Apache 2.4.49
  3. Write a report template for pentesting findings"

Hermes delegates ALL THREE at once. They run in parallel (up to 3 at a time by default).
```

### 4.2 Real pentesting scenario

```
"Run these three tasks in parallel:

Task 1: Full port scan
  → nmap -p- -sV -sC 10.10.10.100
  → Save output to ~/labs/target-100/nmap-full.txt

Task 2: Web enumeration (if port 80 is open)
  → gobuster dir -u http://10.10.10.100 -w /usr/share/wordlists/dirb/common.txt
  → Save to ~/labs/target-100/gobuster.txt

Task 3: Vulnerability research
  → Search for exploits related to whatever services nmap finds
  → Check searchsploit and exploit-db
  → Save to ~/labs/target-100/vulns.md

All three run in parallel. Report back when each finishes."
```

### 4.3 Real coding scenario

```
"Build these two features in parallel:

Task 1: Backend API
  → Create FastAPI endpoint /api/users with CRUD operations
  → Use SQLAlchemy models, Pydantic schemas
  → Write tests in tests/test_users.py
  → Working directory: /home/kali/Coding/MyApp/backend

Task 2: Frontend component
  → Create React UserList component with search and pagination
  → Use the API schema: GET /api/users returns {users: [{id, name, email}]}
  → Write tests with Jest
  → Working directory: /home/kali/Coding/MyApp/frontend

Both run in parallel. I'll integrate them after."
```

### 4.4 Real research scenario

```
"Research these three topics in parallel:

Task 1: Docker escape techniques
  → Find all known container escape methods
  → Include: privileged mode, socket mount, cgroup, capabilities
  → Save to ~/research/docker-escape.md

Task 2: Active Directory attack paths
  → Kerberoasting, AS-REP roasting, Pass-the-Hash, Golden Ticket
  → Include tool commands (Impacket, Mimikatz)
  → Save to ~/research/ad-attacks.md

Task 3: OWASP Top 10 2021 deep dive
  → Each vulnerability: how it works, how to test, how to fix
  → Include code examples
  → Save to ~/research/owasp-top10.md

Deliver each as it completes. I don't need to wait for all three."
```

---

## PART 5: DELEGATION PATTERNS (Copy-Paste Templates)

### Pattern 1: Recon + Research (pentesting)

```
"Delegate two parallel tasks:

Task 1 — RECON:
Run reconnaissance on target TARGET_IP. Use nmap -sV -sC first, 
then based on open ports, run appropriate enumeration tools 
(gobuster for HTTP, enum4linux for SMB, nikto for web).
Save all output to ~/labs/TARGET_NAME/recon/.

Task 2 — RESEARCH:
While recon runs, research all known vulnerabilities for common 
services found on CTF targets: HTTP (Apache, Nginx, IIS), 
SMB, SSH, FTP, RDP. Focus on misconfigurations and default creds. 
Save to ~/labs/TARGET_NAME/research.md.

Context for both: Kali Linux, tools in /usr/bin, wordlists in 
/usr/share/wordlists/. Save all findings as markdown."
```

### Pattern 2: Build + Test (coding)

```
"Delegate two parallel tasks:

Task 1 — BUILD:
Create a Python CLI tool that takes a domain name and runs:
1. whois lookup
2. DNS enumeration (A, AAAA, MX, NS, TXT records)
3. SSL certificate check (expiry, issuer, SANs)
Use argparse, socket, ssl, whois modules.
Save to /home/kali/Coding/domain-lookup/main.py.

Task 2 — TEST:
While Task 1 builds, write a test plan for the domain lookup tool.
What edge cases? What malicious inputs? What rate limiting concerns?
Create a pytest file at /home/kali/Coding/domain-lookup/test_main.py
with test stubs.

Working directory for both: /home/kali/Coding/domain-lookup/"
```

### Pattern 3: Learn + Document (study)

```
"Delegate two parallel tasks:

Task 1 — LEARN:
Research Buffer Overflow exploitation step by step:
1. What is a buffer overflow?
2. How to find them (fuzzing, source review)
3. How to exploit (EIP overwrite, shellcode, bad characters)
4. Tools: immunity debugger, mona.py, msfvenom
Write as a beginner-friendly tutorial.
Save to ~/study/buffer-overflow-guide.md.

Task 2 — LAB SETUP:
While Task 1 researches, set up a practice environment:
1. Check if ~/study/bof-lab/ exists, create if not
2. Write a vulnerable C program (simple strcpy overflow)
3. Compile with: gcc -fno-stack-protector -z execstack -o vuln vuln.c
4. Create a README.md with setup instructions
Working directory: ~/study/bof-lab/"
```

### Pattern 4: Monitor + Report (automation)

```
"Delegate two parallel tasks:

Task 1 — MONITOR:
Check all my running Docker containers. For each:
- Image version (is it latest?)
- Exposed ports
- Uptime
- Resource usage (docker stats --no-stream)
Save report to ~/reports/docker-health.md.

Task 2 — CLEANUP:
While Task 1 monitors, clean up:
- Remove stopped containers
- Remove dangling images
- Prune unused volumes (be careful, ask docker to show what would be removed)
Report what was cleaned to ~/reports/docker-cleanup.md."
```

---

## PART 6: IMPORTANT RULES & LIMITATIONS

### 6.1 Subagents are BLANK SLATES

Subagents know NOTHING about your session. No memory. No conversation history. No Mem0. Everything they need must be in the `context`.

```
❌ BAD: "Fix the bug I mentioned earlier"
        → Subagent has no idea what bug you're talking about

✅ GOOD: "Fix the SQL injection in /home/kali/Coding/MyApp/routes/users.py 
         line 45. The user_id parameter is passed directly to the SQL query 
         without sanitization. Use parameterized queries."
```

### 6.2 Subagents CANNOT ask questions

If a subagent gets stuck, it just fails. Design tasks that are self-contained with clear success criteria.

```
❌ BAD: "Research this topic and let me know if you need clarification"
        → Subagent can't ask for clarification

✅ GOOD: "Research CVE-2024-6387. Find: (1) affected versions, (2) exploitation
         method, (3) PoC availability. Save to ~/research/cve-2024-6387.md.
         If you can't find PoCs, note that and move on."
```

### 6.3 Subagents are NOT DURABLE

If you close Hermes (Ctrl+C or /quit), running subagents DIE. For work that must survive, use cron jobs instead.

```
Task type              → Use
─────────────────────────────────────
Quick parallel work    → delegate_task (minutes)
Long independent work  → cron job (hours/days)
Server/daemon          → terminal(background=True)
Build/scan (1-10 min)  → terminal(background=True, notify_on_complete=True)
```

### 6.4 Max 3 concurrent (by default)

```
delegation.max_concurrent_children: 3    # default in config.yaml
```

If you delegate 5 tasks, only 3 run at once. The other 2 queue up. Increase in config:

```bash
hermes config set delegation.max_concurrent_children 5
```

### 6.5 Verifying subagent results

Subagent messages are SELF-REPORTS. A subagent claiming "I saved the file" might be wrong. For critical operations, verify:

```
"Delegate: Scan 10.10.10.5 and save to ~/labs/scan.txt"

... subagent reports "Done, saved to ~/labs/scan.txt" ...

"Read back ~/labs/scan.txt and verify the scan completed successfully"
```

---

## PART 7: COMPARISON — All Background Methods

| Method | Lives after /quit? | Can ask you? | Best for | Max runtime |
|--------|-------------------|-------------|----------|-------------|
| **delegate_task** | NO | NO | Parallel independent reasoning tasks | Minutes |
| **terminal(bg=true)** | NO | NO | Shell commands, servers, builds | Hours/days |
| **cron job** | YES | NO | Scheduled recurring work | 3 min per run |
| **/background** | NO | NO | Quick async prompt | Minutes |
| **/queue** | NO | YES (next turn) | Queue a message for later | Until next turn |

---

## PART 8: CONFIG OPTIONS

```bash
# See current delegation settings
hermes config | grep delegation

# Change model for subagents (use cheaper model for workers!)
hermes config set delegation.provider openrouter
hermes config set delegation.model openrouter/deepseek/deepseek-chat

# Max parallel subagents (default 3)
hermes config set delegation.max_concurrent_children 5

# Max iterations per subagent (default 50)
hermes config set delegation.max_iterations 30

# Reasoning effort for subagents
hermes config set delegation.reasoning_effort low
```

**Pro tip:** Set subagents to use a CHEAP model (DeepSeek). They do mechanical work, not hard reasoning. Save Claude/GPT-4 for the main conversation where YOU are.

---

## PART 9: QUICK REFERENCE

### How to ask Hermes to delegate (natural language)

```
"Research X and save to ~/path. Delegate this."

"Do these three things in parallel: (1) X, (2) Y, (3) Z"

"While you work on this, delegate research on Y to a subagent"

"Spawn a subagent to build the tests while we discuss the architecture"
```

### Task template (copy this pattern)

```
"Delegate this task:

Goal: [One sentence — what to accomplish]

Deliverable: [Specific file, output, or action]

Context:
- Working directory: /path/to/project
- Tools to use: [web_search, terminal, etc.]
- Constraints: [do NOT do X, limit to Y]
- Environment: [Kali Linux, Python 3.12, etc.]

Success criteria: [How I'll know it's done right]"
```

### Config quick set
```bash
hermes config set delegation.provider openrouter
hermes config set delegation.model openrouter/deepseek/deepseek-chat
hermes config set delegation.max_concurrent_children 3
```

---

## PART 10: YOUR CHEAT SHEET (For Skullcrusher's Workflow)

### Pentesting Lab Day
```
"Do three things in parallel:

1. Full nmap scan on TARGET_IP → save to ~/labs/NAME/nmap.txt
2. Research all CVEs for discovered services → save to ~/labs/NAME/cves.md
3. Run gobuster on any web ports found → save to ~/labs/NAME/web.txt"
```

### Coding Sprint
```
"Build in parallel:

1. Backend: FastAPI CRUD for [resource] → ~/Coding/Project/backend/
2. Frontend: React component for [feature] → ~/Coding/Project/frontend/
3. Tests: Write pytest for backend → ~/Coding/Project/tests/"
```

### Research Mode
```
"Research three topics in parallel:

1. Windows PrivEsc: [technique] → ~/research/windows/
2. Active Directory: [attack] → ~/research/ad/
3. Web exploits: [vulnerability class] → ~/research/web/"
```

### Study Session
```
"Two parallel tasks:

1. Explain [topic] in simple terms with examples → ~/study/topic-guide.md
2. Create practice lab for [topic] with setup instructions → ~/study/topic-lab/"
```

---

That's delegation. The pattern is always the same: independent tasks → delegate parallel → get results faster. Start with 2 parallel tasks today and see how it feels.
