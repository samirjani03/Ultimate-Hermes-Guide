# Hermes Agent — The Complete Command Reference

> The self-improving AI agent built by Nous Research.

> Every command you'll ever need, organized by what you're trying to do. No explanations. No fluff. Just commands and what they do. Use this as your single-page cheat sheet.

> Official Docs: <a href="https://hermes-agent.nousresearch.com/docs" target="_blank" rel="noopener noreferrer">https://hermes-agent.nousresearch.com/docs</a>
---

## STARTING & SESSION CONTROL

```bash
hermes                              # Start interactive chat
hermes chat -q "question"           # Single query, no interactive session
hermes --continue                   # Resume most recent session
hermes -c                           # Same as --continue
hermes --resume "session-name"      # Resume by title
hermes --resume abc123              # Resume by session ID
hermes --skills skill1,skill2       # Start with skills pre-loaded
hermes -s skill1                    # Short form of --skills
hermes --yolo                       # Skip command approval prompts
hermes --profile work               # Start with specific profile
hermes -p work                      # Short form of --profile
hermes --checkpoints                # Enable /rollback filesystem snapshots
hermes --ignore-rules               # Skip project context files + SOUL.md
hermes -m "provider/model"          # Override model for this session
hermes -v                           # Verbose output
hermes -Q                           # Quiet mode (no banner/spinner)
hermes --worktree / -w              # Isolated git worktree mode
hermes --pass-session-id            # Include session ID in system prompt
hermes --source cli                 # Set session source tag
```

---

## SESSION MANAGEMENT

```bash
hermes sessions list                # List recent 20 sessions
hermes sessions list --limit 50     # List last 50 sessions
hermes sessions browse              # Interactive TUI session picker
hermes sessions stats               # Show totals: count, tokens, cost
hermes sessions rename abc123 "Name" # Give a session a meaningful name
hermes sessions delete abc123 --yes # Delete one session
hermes sessions export abc123 ./    # Export session to file
hermes sessions export abc123 ./ --format md     # Export as markdown
hermes sessions export abc123 ./ --format jsonl  # Export as JSONL
hermes sessions export abc123 ./ --format html   # Export as HTML
hermes sessions export abc123 ./ --format trace  # Export as trace (HF viewer)
hermes sessions export abc123 ./ --format qmd    # Export as Quarto
hermes sessions export --title "Project:" ./     # Bulk export by title pattern
hermes sessions prune --older-than 7d --dry-run  # Preview what will be deleted
hermes sessions prune --older-than 7d --yes      # Delete sessions older than 7 days
hermes sessions prune --title "doubt" --older-than 3d --dry-run  # Filter by title
hermes sessions archive --older-than 7d --yes    # Soft-hide (recoverable)
hermes sessions archive --older-than 7d --dry-run # Preview archive
```

---

## CONFIGURATION & SETUP

```bash
hermes config                       # View current config
hermes config edit                  # Open config.yaml in $EDITOR
hermes config set key value         # Set a single config value
hermes config path                  # Print config.yaml location
hermes config env-path              # Print .env location
hermes config check                 # Check for missing/outdated config
hermes config migrate               # Pull in new options after upgrade
hermes setup                        # Interactive setup wizard
hermes setup model                  # Setup just the model section
hermes setup terminal               # Setup terminal settings
hermes setup gateway                # Setup messaging platforms
hermes setup tools                  # Setup tools
hermes doctor                       # Health check (deps, config, providers)
hermes doctor --fix                 # Auto-fix what's broken
hermes status                       # Show component status
hermes status --all                 # Detailed status
hermes update                       # Update Hermes to latest version
hermes uninstall                    # Uninstall Hermes
```

---

## MODEL MANAGEMENT

```bash
hermes model                        # Interactive model/provider picker
hermes model --list                 # List available models
hermes auth                         # Interactive credential manager
hermes auth add [provider]          # Add OAuth or API key credential
hermes auth list [provider]         # List pooled credentials
hermes auth remove PROVIDER INDEX   # Remove a credential
hermes auth reset PROVIDER          # Clear exhaustion status
hermes portal                       # Quick setup via Nous Portal
hermes proxy                        # OpenAI-compatible local proxy
```

---

## TOOLS MANAGEMENT

```bash
hermes tools                        # Interactive tools TUI (enable/disable)
hermes tools list                   # Show all tools and their status
hermes tools enable terminal        # Enable a toolset
hermes tools disable browser        # Disable a toolset
```

---

## TERMINAL & PROCESS CONTROL

```bash
# Hermes calls these internally. You direct it with natural language.
# But understanding the patterns helps you instruct Hermes better.

# Foreground (default): commands return instantly when done
terminal(command="nmap -sV target", timeout=120)

# Background bounded task: use notify_on_complete
terminal(command="nmap -p- target", background=true, notify_on_complete=true)

# Background server: no notify (never exits)
terminal(command="uv run uvicorn main:app", background=true)

# PTY mode for interactive tools
terminal(command="python", pty=true)
terminal(command="msfconsole", pty=true)

# Process management
process(action="list")                          # Show all background processes
process(action="poll", session_id="abc")         # Check status + new output
process(action="log", session_id="abc")          # Full output with pagination
process(action="wait", session_id="abc", timeout=60)  # Block until done
process(action="kill", session_id="abc")         # Terminate process
process(action="submit", session_id="abc", data="y")  # Send response + Enter
process(action="write", session_id="abc", data="text") # Send raw stdin
process(action="close", session_id="abc")        # Close stdin / send EOF
```

---

## MEMORY

```bash
hermes memory status                # Show active provider + stats
hermes memory setup                 # Pick external memory provider (interactive)
hermes memory off                   # Disable external provider (keep built-in)

# Manual configuration
hermes config set memory.provider mem0
echo "MEM0_API_KEY=m0-xxx" >> ~/.hermes/.env
```

---

## SKILLS

```bash
hermes skills list                  # List installed skills
hermes skills browse                # Browse skills catalog
hermes skills search "docker"       # Search catalog
hermes skills install name          # Install from hub or URL
hermes skills inspect name          # Preview without installing
hermes skills check                 # Check for updates
hermes skills update                # Update outdated skills
hermes skills uninstall name        # Remove a skill
hermes skills config                # Enable/disable per platform
hermes skills publish PATH          # Publish to registry
hermes skills tap add REPO          # Add GitHub repo as skill source
```

---

## SKILL CURATOR (Auto-Maintenance)

```bash
hermes curator status               # Check curator health
hermes curator run                  # Trigger maintenance pass
hermes curator pause                # Pause background maintenance
hermes curator resume               # Resume
hermes curator pin name             # Protect skill from auto-archive
hermes curator unpin name           # Remove protection
hermes curator archive name         # Archive stale skill
hermes curator restore name         # Restore from archive
hermes curator prune                # Clean up old archives
hermes curator backup               # Manual backup
hermes curator rollback             # Restore from backup
```

---

## CRON JOBS

```bash
hermes cron list                    # List active jobs
hermes cron list --all              # Include paused/disabled
hermes cron create "30m"            # Create job: run every 30 min
hermes cron create "every day at 9am"  # Human-readable schedule
hermes cron create "0 9 * * *"      # 5-field cron schedule
hermes cron create "2026-07-15T09:00:00"  # One-shot at ISO timestamp
hermes cron edit JOB_ID             # Edit schedule, prompt, delivery
hermes cron pause JOB_ID            # Temporarily pause
hermes cron resume JOB_ID           # Resume paused job
hermes cron run JOB_ID              # Trigger NOW (manual, doesn't affect schedule)
hermes cron remove JOB_ID           # Permanently delete
hermes cron status                  # Scheduler health check

# Common schedule formats:
# "30m"           = every 30 minutes
# "2h"            = every 2 hours
# "every 6h"      = every 6 hours
# "every monday 9am"
# "every day at midnight"
# "every friday 5pm"
# "0 9 * * *"     = daily at 9 AM
# "0 */6 * * *"   = every 6 hours
# "0 9 * * 1"     = every Monday 9 AM
```

---

## GATEWAY (Messaging Platforms)

```bash
hermes gateway run                  # Start gateway foreground (testing)
hermes gateway install              # Install as background systemd service
hermes gateway start                # Start the service
hermes gateway stop                 # Stop the service
hermes gateway restart              # Restart
hermes gateway status               # Check if running
hermes gateway setup                # Configure platforms (Telegram, Discord, etc.)

# Pairing (who can talk to your bot)
hermes pairing list                 # Pending authorization requests
hermes pairing approve ID           # Allow a user
hermes pairing revoke ID            # Block a user

# Sending messages
hermes send                         # Send one-off message through gateway
```

---

## MCP SERVERS

```bash
pip install mcp                     # Prerequisite: install MCP SDK

hermes mcp install name             # Install from Hermes MCP catalog
hermes mcp add name                 # Manually add server (interactive)
hermes mcp list                     # List configured servers
hermes mcp list --catalog           # Browse catalog entries
hermes mcp test name                # Test server connection
hermes mcp configure name           # Filter which tools to expose (TUI)
hermes mcp remove name              # Remove a server
hermes mcp serve                    # Run Hermes AS an MCP server (expose to IDEs)
```

---

## PLUGINS

```bash
hermes plugins list                 # List installed plugins
hermes plugins install name         # Install from catalog, path, or URL
hermes plugins remove name          # Remove a plugin
```

---

## DELEGATION (Subagents)

```bash
# No direct CLI commands. Config only:
hermes config set delegation.provider deepseek
hermes config set delegation.model deepseek/deepseek-chat
hermes config set delegation.max_concurrent_children 5
hermes config set delegation.max_iterations 30
```

---

## COMPUTER USE (GUI Control)

```bash
hermes computer-use doctor          # Health check for cua-driver
```

---

## PROFILES

```bash
hermes profile list                 # List all profiles
hermes profile create name          # Create new profile
hermes profile create name --clone  # Clone from default
hermes profile use name             # Set as sticky default
hermes profile show name            # Show profile details
hermes profile rename old new       # Rename a profile
hermes profile delete name          # Delete a profile
hermes profile export name          # Export to tar.gz
hermes profile import file          # Import from archive
hermes profile alias name           # Create hermes-name wrapper command
hermes --profile name               # Use profile for this session only
```

---

## WEBHOOKS

```bash
hermes webhook subscribe name       # Create webhook subscription
hermes webhook list                 # List all subscriptions
hermes webhook test name            # Send test POST
hermes webhook remove name          # Delete subscription
```

---

## OTHER CLI COMMANDS

```bash
hermes desktop / gui                # Launch native Electron desktop app
hermes dashboard                    # Web admin panel + embedded chat
hermes insights                     # Usage analytics
hermes insights --days 30           # Last 30 days analytics
hermes kanban init                  # Initialize multi-agent work board
hermes kanban create                # Create task
hermes kanban list / ls             # List tasks
hermes secrets bitwarden ...        # External secret store integration
hermes completion bash              # Generate bash completions
hermes completion zsh               # Generate zsh completions
hermes acp                          # Start ACP server (IDE integration)
hermes claw migrate                 # Migrate from OpenClaw
```

---

## SLASH COMMANDS (Type During Chat)

### Session Control
```
/new                # Fresh session
/reset              # Same as /new
/clear              # Clear screen + new session (CLI)
/retry              # Resend last message
/undo               # Remove last exchange
/title My Task      # Name the current session
/compress           # Manually compress context
/stop               # Kill all background processes
/rollback           # Restore filesystem checkpoint (needs --checkpoints)
/background <task>  # Run prompt in background
/queue <message>    # Queue message for next turn
/steer <message>    # Inject correction after next tool call
/agents             # Show active subagents and status
/tasks              # Same as /agents
/resume <name>      # Jump to named session
/goal <text>        # Set standing goal across turns
/goal status        # Check current goal
/goal clear         # Remove goal
/redraw             # Force UI repaint (CLI)
```

### Configuration
```
/config             # Show current config (CLI)
/model              # Show current model
/model claude-sonnet-4  # Switch model mid-session
/reasoning high     # Make model think harder (none/minimal/low/medium/high/xhigh)
/reasoning show     # Show model thinking in chat
/reasoning hide     # Hide thinking
/verbose            # Cycle: off → new → all → verbose
/voice on           # Voice-to-voice mode
/voice tts          # Always respond with voice
/voice off          # Disable voice
/yolo               # Toggle approval bypass on/off
/busy queue         # What Enter does while Hermes works (queue/steer/interrupt/status)
/indicator emoji    # Change busy spinner (kaomoji/emoji/unicode/ascii)
/skin dark          # Change theme (CLI)
/statusbar          # Toggle status bar (CLI)
/footer on          # Toggle gateway metadata footer
```

### Tools & Skills
```
/tools              # Manage tools (interactive TUI)
/toolsets           # List available toolsets
/skills             # Browse and install skills
/skill <name>       # Load a skill into session
/reload-skills      # Rescan ~/.hermes/skills/
/reload             # Reload .env variables
/reload-mcp         # Reload MCP servers
/cron               # Manage cron jobs (interactive)
/curator status     # Skill curator status
/curator run        # Trigger curator maintenance
/plugins            # Manage plugins (interactive)
```

### Gateway
```
/approve            # Approve pending command (gateway)
/deny               # Deny pending command
/restart            # Restart gateway
/sethome            # Set current chat as home channel
/update             # Update Hermes to latest
/topic              # Manage Telegram topic sessions
/platforms          # Show connected platforms
/gateway            # Same as /platforms
```

### Utility
```
/branch             # Fork current session
/fork               # Same as /branch
/handoff telegram   # Hand session to messaging platform
/fast               # Toggle priority processing
/browser            # Open CDP browser connection
/history            # Show conversation history
/save               # Save conversation to file
/copy 1             # Copy last assistant response to clipboard
/paste              # Attach clipboard image
/image /path/file   # Attach local image for vision
```

### Info
```
/help               # Show all commands
/commands           # Browse all commands (gateway)
/usage              # Show token usage
/insights           # Usage analytics
/insights 7         # Last 7 days
/status             # Session info (gateway)
/profile            # Active profile info
/debug              # Upload debug report, get shareable link
```

### Exit
```
/quit               # Exit Hermes
/exit               # Same as /quit
/q                  # Same as /quit
```

---

## CONFIG QUICK SETS (Recommended Defaults)

```bash
# Show what's happening
hermes config set display.tool_progress true
hermes config set display.show_cost true

# Smart approval (AI judges risk level)
hermes config set approvals.mode smart

# Longer timeout for builds
hermes config set terminal.timeout 300

# Cheap model for subagents
hermes config set delegation.provider openrouter
hermes config set delegation.model openrouter/deepseek/deepseek-chat

# Memory (Mem0 cloud)
hermes config set memory.provider mem0

# TUI mode
hermes config set display.interface tui
```

---

## FILE PATHS (Important Locations)

```
~/.hermes/config.yaml           # Main configuration
~/.hermes/.env                  # API keys and secrets
~/.hermes/skills/               # Installed skills
~/.hermes/plugins/              # Your custom plugins
~/.hermes/profiles/             # Named profiles
~/.hermes/sessions/             # Session files
~/.hermes/state.db              # Session database (SQLite + FTS5)
~/.hermes/logs/                 # Gateway and error logs
~/.hermes/auth.json             # OAuth tokens and credentials
~/.hermes/mcp_servers.json      # MCP server configurations
~/.hermes/webhook_subscriptions.json  # Webhook routes
~/.hermes/MEMORY.md             # Built-in agent memory
~/.hermes/USER.md               # Built-in user profile
~/.hermes/SOUL.md               # Agent identity (global)
~/.hermes/scripts/              # Cron job scripts
```

---

## PROJECT CONTEXT FILES (Auto-Discovered)

```
.hermes.md / HERMES.md          # Hermes-specific rules (walks up to git root)
AGENTS.md / agents.md           # Portable rules (cwd only)
CLAUDE.md / claude.md           # Claude-flavored rules (cwd only)
.cursorrules                    # Cursor IDE rules (cwd only)
SOUL.md                         # Agent identity (in $HERMES_HOME, always loaded)
```

---

That's it. Every Hermes command, organized. Bookmark this file.
