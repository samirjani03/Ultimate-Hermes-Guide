# Hermes Memory Guide — From Beginner to Pro

> **Official reference:** This guide is checked against the [Hermes Memory documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) and [Memory Providers documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers). Refer to them for the current memory model and supported providers.

> Memory is what makes Hermes YOUR agent, not just a chatbot. Without it, every session starts from zero. With it, Hermes remembers who you are, how you work, and what you've learned together. This guide covers everything: built-in memory, 8 external providers, Mem0 vs Cognee vs TencentDB, pricing, setup, and pro tips.

---

## PART 1: MEMORY CONCEPTS (The "Why")

### 1.1 What problem does memory solve?

Without memory:
```
Session 1: "I'm Skull_crusher, I use Kali in VirtualBox, Python 3.12, uv not pip"
Session 2: "I'm Skull_crusher, I use Kali in VirtualBox, Python 3.12, uv not pip"
Session 3: "I'm Skull_crusher, I use Kali in VirtualBox..."
```

With memory:
```
Session 1: "I'm Skull_crusher, I use Kali in VirtualBox, Python 3.12, uv not pip"
Session 2: "Continue the TraceixExplorer feature from yesterday"
Session 3: "Run tests on the new module"
```

**Memory = you never repeat yourself.** Hermes already knows your environment, preferences, projects, and past decisions.

---

### 1.2 Two layers of memory in Hermes

Hermes has TWO memory systems that work together:

| Layer | What it is | Always active? |
|-------|-----------|---------------|
| **Built-in** | MEMORY.md + USER.md + session DB (SQLite/FTS5) | YES — always |
| **External provider** | Mem0, Honcho, Hindsight, etc. (pick ONE) | Optional — `hermes memory setup` |

Think of it like this:
- **Built-in** = Hermes's notepad. Simple, fast, local, no setup.
- **External** = Hermes's second brain. Semantic search, knowledge graphs, long-term reasoning.

You CAN use just built-in memory. It's already working right now. External providers are an UPGRADE for when you outgrow the basics.

---

### 1.3 How memory flows in a session

```
Session starts
    ↓
Built-in memory loaded (MEMORY.md + USER.md from disk)
    ↓
External provider memory loaded (if configured — Mem0/Honcho/etc.)
    ↓
Both injected into system prompt before first turn
    ↓
During session: Hermes saves new facts via memory tool
    ↓
Session ends: facts written to disk + external provider
    ↓
Next session: everything is there
```

---

## PART 2: BUILT-IN MEMORY (Default — Already Working)

### 2.1 What's included

Three files + one database:

| Component | File | What it stores |
|-----------|------|---------------|
| **User Profile** | `~/.hermes/USER.md` | Who you are: name, timezone, skills, goals |
| **Agent Memory** | `~/.hermes/MEMORY.md` | What Hermes knows: environment, quirks, conventions |
| **Session DB** | `~/.hermes/state.db` | Full conversation history (FTS5 searchable) |
| **Session Search** | Same DB | `session_search()` tool for finding past discussions |

---

### 2.2 Memory budgets

```
USER.md:   1,375 characters max   — your profile
MEMORY.md: 2,200 characters max   — agent notes
```

You can see your current usage at the top of every session:
```
MEMORY (your personal notes) [46% — 1,028/2,200 chars]
USER PROFILE (who you are) [94% — 1,296/1,375 chars]
```

Your user profile is nearly full (94%). When it hits 100%, old entries need trimming to add new ones.

---

### 2.3 Managing built-in memory

```bash
# Check memory status
hermes memory status

# View the files directly
cat ~/.hermes/USER.md
cat ~/.hermes/MEMORY.md

# Search past sessions (FTS5 full-text, no LLM cost)
# Hermes does this automatically with session_search()
# You can ask: "What did we discuss about Docker last week?"
```

---

### 2.4 Built-in memory commands

```bash
hermes memory status          # Show active provider + stats
hermes memory setup           # Pick an external provider (interactive)
hermes memory off             # Disable external provider, keep built-in
```

**Important:** `hermes memory off` only disables the EXTERNAL provider. Built-in memory NEVER turns off. Your USER.md and MEMORY.md always load.

---

## PART 3: EXTERNAL MEMORY PROVIDERS (The Upgrade)

### 3.1 All 8 providers at a glance

```bash
hermes memory setup    # Opens interactive picker with all 8 options
```

| Provider | Type | Cost | Best for |
|----------|------|------|----------|
| **Mem0** | Cloud + OSS | Free tier (10K memories) | Fastest setup, best Hermes integration |
| **Honcho** | Self-hosted | Free (your server) | User behavior modeling, dialectic memory |
| **Hindsight** | Self-hosted | Free (open source) | Temporal memory, chronological recall |
| **OpenViking** | Self-hosted | Free (open source) | Multi-agent systems |
| **Holographic** | Self-hosted | Free (open source) | Experimental, vector holography |
| **RetainDB** | Self-hosted | Free (open source) | Simple key-value persistence |
| **ByteRover** | Self-hosted | Free (open source) | Lightweight, edge deployment |
| **SuperMemory** | Cloud | Free tier available | Browser/bookmark-style memory |

**Key rule:** Only ONE external provider can be active at a time. Built-in memory is ALWAYS active alongside it.

---

### 3.2 Quick comparison: which one for you?

```
You want...                              Pick...
─────────────────────────────────────────────────────
Fastest setup, no server to manage       Mem0 (cloud free tier)
Full control, self-hosted, free          Honcho (Docker on your Kali VM)
Best for remembering timelines           Hindsight
Multi-agent projects later               OpenViking
Just testing, don't overthink            Mem0
```

---

## PART 4: DEEP DIVE — Mem0 (My Recommendation for You)

### 4.1 What is Mem0?

Mem0 is the most popular AI memory layer. It stores memories as vector embeddings and retrieves them with semantic search. Instead of exact keyword matching ("Docker") it understands meaning ("containerization tool used for deployment").

**Architecture:**
```
User says something → Mem0 extracts key facts → stores as embeddings
Later: "What deployment tool do I use?" → semantic search → finds "Docker"
Even though the word "deployment" was never in the original memory
```

### 4.2 Is it free? YES — two ways.

| Option | Cost | What you get |
|--------|------|-------------|
| **Mem0 Cloud Free Tier** | $0 | 10,000 memories, hosted by Mem0, 30-second setup |
| **Mem0 Open Source** | $0 | Self-host on your own machine, unlimited memories |

**For you as a student:** Start with the cloud free tier. 10,000 memories is more than you'll use in a year. If you ever hit the limit, switch to self-hosted.

### 4.3 Setup (cloud free tier — 2 minutes)

```bash
# Step 1: Open the setup picker
hermes memory setup

# Step 2: Select "Mem0" from the list

# Step 3: Hermes asks "Cloud or Self-hosted?" — pick Cloud

# Step 4: Hermes asks for your API key
# Get one at: https://app.mem0.ai → Sign up → API Keys → Create
# It's free, no credit card needed

# Step 5: Paste the key when prompted

# Step 6: Verify
hermes memory status
# Should show: "Provider: mem0 (active)"
```

That's it. Hermes now uses Mem0 for long-term memory. Your built-in memory still works alongside it.

### 4.4 Manual configuration (if setup wizard fails)

```bash
# Set provider
hermes config set memory.provider mem0

# Add API key to .env
echo "MEM0_API_KEY=m0-xxxxxxxxxxxx" >> ~/.hermes/.env

# Verify
hermes memory status
```

### 4.5 Self-hosted Mem0 (free, unlimited, more work)

```bash
# Clone and run Mem0 locally
git clone https://github.com/mem0ai/mem0.git
cd mem0
docker compose up -d

# Configure Hermes to use local Mem0
hermes config set memory.provider mem0
hermes config set memory.mem0.base_url http://localhost:8000
# No API key needed for local
```

**Verdict:** Self-hosting Mem0 on your Kali VM is doable but adds overhead (Docker containers, maintenance). Cloud free tier is zero maintenance and more than enough for a single user.

---

## PART 5: DEEP DIVE — Honcho (Self-Hosted, Free)

### 5.1 What is Honcho?

Honcho takes a different approach. Instead of just storing facts, it builds a **behavioral model** of you over time. It learns how you think, what you prefer, and how you make decisions — not just what you said.

**Mem0 approach:** "User said: prefers uv over pip"
**Honcho approach:** "User consistently chooses Rust-like tools, values speed, dislikes bloated package managers → recommend uv for Python, cargo for Rust, pnpm for Node"

Honcho is called "dialectic memory" because it models the dialogue between you and the agent, not just the facts.

### 5.2 Setup (Docker on your Kali VM)

```bash
# Step 1: Clone Honcho
git clone https://github.com/plastic-labs/honcho.git
cd honcho

# Step 2: Start with Docker
docker compose up -d

# Step 3: Configure Hermes
hermes memory setup
# Select "Honcho"
# Base URL: http://localhost:8000
# JWT token: generate one (instructions in Honcho docs)

# Or manual:
hermes config set memory.provider honcho
hermes config set memory.honcho.base_url http://localhost:8000
```

### 5.3 Honcho vs Mem0 — which is better?

| | Mem0 | Honcho |
|---|------|--------|
| Setup time | 2 minutes | 15-30 minutes |
| Maintenance | None (cloud) | You manage the Docker container |
| Cost | Free tier (10K memories) | Free (your hardware) |
| Memory style | Fact storage + semantic search | Behavioral model + user understanding |
| Best for | Quick start, general use | Deep personalization, long-term relationship |
| Offline? | Cloud = no, self-hosted = yes | Yes (runs on your VM) |

**My take:** Start with Mem0 cloud free tier. If you love it and want more, either stay on Mem0 or try Honcho self-hosted. Don't start with Honcho — the setup friction might kill your momentum.

---

## PART 6: COGNEE & TENCENTDB — Can They Work With Hermes?

### 6.1 Cognee (by Topoteretes)

**What it is:** Open-source AI memory platform. Ingests data in any format, builds a self-hosted knowledge graph. Uses graph + vector + relational retrieval.

**Strengths:**
- Knowledge graphs (rich, connected memory — not just isolated facts)
- Multi-format ingestion (PDFs, code, text, APIs)
- Self-hosted, full control
- Good for complex, structured knowledge domains

**Weaknesses:**
- NOT a native Hermes provider — no `hermes memory setup` option for it
- Requires custom integration (MCP server, plugin, or API wrapper)
- Heavier than Mem0/Honcho — needs a proper database
- Overkill for a single user with a single agent

**Can it work with Hermes?** Yes, but indirectly. You'd need to:
1. Host Cognee separately
2. Build an MCP server that bridges Cognee ↔ Hermes
3. Or write a custom Hermes plugin

This is advanced territory. Not recommended for now.

### 6.2 TencentDB Agent Memory

**What it is:** MIT-licensed, fully local, 4-tier memory pipeline (L0-L3). Uses a semantic pyramid: symbolic short-term → episodic → semantic → procedural memory. Zero external API dependencies.

**Strengths:**
- Fully local (privacy, no API costs)
- Sophisticated 4-tier architecture (closest to human memory model)
- MIT license (truly open)
- Active development (new in May 2026)

**Weaknesses:**
- NOT a native Hermes provider
- Very new — less community, fewer examples
- Requires PostgreSQL with pgvector
- Complex setup compared to Mem0

**Can it work with Hermes?** Same as Cognee — needs custom integration. The 4-tier architecture is impressive on paper, but the integration work is substantial.

### 6.3 Honest verdict on Cognee vs TencentDB vs Mem0

```
For a student/developer using Hermes on Kali Linux in 2026:

1. Mem0 (cloud free tier)     → ★★★★★  Start here. 2 min setup. Free.
2. Mem0 (self-hosted)         → ★★★★☆  More control, zero cost, more work.
3. Honcho (self-hosted)       → ★★★★☆  Best long-term potential, setup effort.
4. Cognee                     → ★★★☆☆  Powerful but no Hermes integration yet.
5. TencentDB Agent Memory     → ★★★☆☆  Promising architecture, too new, no integration.
```

**My recommendation for YOU specifically:**

Start with **Mem0 cloud free tier**. You're a student on a budget. It's free, instant, and the Hermes integration is first-class (Mem0 officially documents Hermes integration). When you outgrow the free tier (unlikely for months), you have three paths:
- Stay on Mem0 but self-host (free, unlimited)
- Switch to Honcho (free, behavioral memory)
- Wait until Cognee/TencentDB get native Hermes plugins

---

## PART 7: STEP-BY-STEP SETUP GUIDES

### 7.1 Mem0 Cloud Free Tier (Recommended — Do This Now)

```bash
# 1. Get API key (free, no credit card)
#    Open: https://app.mem0.ai
#    Sign up → API Keys → Create Key → Copy it

# 2. Run setup
hermes memory setup

# 3. Select "Mem0" → "Cloud" → Paste your key

# 4. Verify
hermes memory status
# Expected: "External memory provider: mem0 ✓ Active"

# 5. Test it
# Start a new session and tell Hermes something memorable:
hermes
"This is a test: my favorite pentesting tool is Burp Suite and I prefer dark themes."
# End session (/quit)

# Start new session:
hermes
"What's my favorite pentesting tool?"
# Hermes should remember: "Burp Suite"
```

### 7.2 Honcho Self-Hosted (For When You Want Full Control)

```bash
# Prerequisites: Docker running on your Kali VM

# 1. Clone and start Honcho
cd ~/tools
git clone https://github.com/plastic-labs/honcho.git
cd honcho
docker compose up -d

# 2. Verify it's running
curl http://localhost:8000/health

# 3. Configure Hermes
hermes memory setup
# Select "Honcho"
# Base URL: http://localhost:8000
# Auth token: generate from Honcho docs (JWT)

# 4. Verify
hermes memory status
```

### 7.3 Switching providers

```bash
# Disable current external provider
hermes memory off

# Set up new one
hermes memory setup

# Your existing built-in memory (USER.md, MEMORY.md) is untouched
# Only the external provider changes
```

### 7.4 Disabling external memory

```bash
hermes memory off
# External provider disabled. Built-in memory still active.
# Use this if Mem0 goes down or you want to pause it.
```

---

## PART 8: PRO TIPS

### 8.1 What to save to memory (and what NOT to)

**SAVE to memory (durable facts):**
- "User prefers uv over pip for Python"
- "Project X uses PostgreSQL 16 on port 5432"
- "Kali VM has 8GB RAM — avoid parallel heavy builds"
- "User skill level: Python 7/10, Bash 3/10"

**DO NOT save to memory (temporary/stale):**
- "Working on feature X today"
- "Last build failed with error Y"
- "PR #42 merged yesterday"
- "Currently debugging auth module"

**Rule:** If the fact will still be true in 2 weeks, save it. If it's about what happened TODAY, don't.

### 8.2 Memory budget management

When your USER.md or MEMORY.md hits the limit:

```bash
# Check what's eating space
cat ~/.hermes/USER.md
cat ~/.hermes/MEMORY.md

# Ask Hermes to consolidate:
"Review my memory and consolidate redundant entries. Remove stale facts."
```

Hermes can use batch operations (add + remove in one atomic call) to clean up and add new entries without hitting the budget.

### 8.3 Memory + session_search = powerful combo

Memory stores FACTS. session_search finds CONVERSATIONS.

```bash
# In a Hermes session:
"Search my past sessions for discussions about Docker networking"

# Hermes uses session_search() — FTS5 full-text, no LLM cost
# Finds the conversation from 2 weeks ago about Docker bridge networks
```

Use memory for "what" (facts). Use session_search for "when did we discuss" (conversations).

### 8.4 Memory across profiles

If you use multiple Hermes profiles (work, study, personal):

```bash
# Each profile has its OWN memory
hermes --profile work     # loads work memory
hermes --profile study    # loads study memory (separate!)

# Profiles are ISOLATED — study memory doesn't leak into work sessions
```

### 8.5 Privacy note

Built-in memory is local — files on your disk, in your VM. Nobody else can read them.

Mem0 Cloud: your memories are stored on Mem0's servers. They're encrypted, but they leave your machine. Read Mem0's privacy policy if this concerns you.

If you want 100% local memory: use Honcho (self-hosted Docker) or Mem0 self-hosted.

### 8.6 Troubleshooting

```bash
# "Mem0 not responding"
hermes memory status          # Check if provider is active
curl https://api.mem0.ai/health  # Check if Mem0 is up

# "Memory seems empty / lost"
cat ~/.hermes/MEMORY.md      # Check built-in memory
cat ~/.hermes/USER.md        # Check user profile
hermes memory status         # Check external provider

# "Want to start fresh"
hermes memory off            # Disable external
# Built-in memory: Manually edit MEMORY.md and USER.md
# Or ask Hermes: "Clear my memory and start fresh"
```

---

## PART 9: QUICK REFERENCE

```
GOAL                                    COMMAND
──────────────────────────────────────────────────────────────────
Check memory status                     hermes memory status
Set up external provider                hermes memory setup
Disable external provider               hermes memory off
View user profile                       cat ~/.hermes/USER.md
View agent memory                       cat ~/.hermes/MEMORY.md
Set provider manually                   hermes config set memory.provider mem0
Add Mem0 API key                        echo "MEM0_API_KEY=..." >> ~/.hermes/.env
Search past sessions                    "Search my sessions for <query>"
Consolidate memory                      "Consolidate my memory, remove stale entries"
Clear all memory                        "Clear my memory and start fresh"
```

---

## SUMMARY: YOUR MEMORY STRATEGY

As a cybersecurity student running Hermes on Kali Linux:

```
LAYER 1 (already active):  Built-in memory (MEMORY.md + USER.md)
                           Zero setup. Working now. Handles your basics.

LAYER 2 (do this today):   Mem0 Cloud Free Tier
                           hermes memory setup → Mem0 → Cloud → paste key
                           2 minutes. Free. Gives you semantic memory.

LAYER 3 (future upgrade):  Honcho self-hosted OR Mem0 self-hosted
                           When you outgrow the free tier or want full privacy.

NOT RECOMMENDED (yet):     Cognee, TencentDB Agent Memory
                           Great tech, but no Hermes integration yet.
                           Wait for native plugins or MCP bridges.
```

Set up Mem0 now. It's free, it's 2 minutes, and it makes Hermes noticeably smarter across sessions. No reason not to.
