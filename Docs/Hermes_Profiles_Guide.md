# Hermes Profiles: Running Separate Isolated Instances (Study / Work / CTF)

*Sourced from the official docs at hermes-agent.nousresearch.com/docs/user-guide/profiles and the official FAQ page. Commands below are the real, current ones, not guessed.*

---

## 1. What is a profile? (simple version)

A profile is just **a separate Hermes home directory.** Instead of one `~/.hermes` folder holding everything, each profile gets its own folder with its own config, memory, sessions, skills, and cron jobs.

Your normal `~/.hermes` is actually already a profile, it's just called the "default" one. Everything else you create sits alongside it.

```
~/.hermes/                     ← default profile
~/.hermes/profiles/study/      ← study profile
~/.hermes/profiles/work/       ← work profile
~/.hermes/profiles/ctf/        ← ctf profile
```

The magic part: **the moment you create a profile, it becomes its own command.** Create a profile called `ctf` and you instantly get `ctf chat`, `ctf setup`, `ctf gateway start`, all of it, no extra config needed.

---

## 2. What's actually isolated (and what's NOT)

| Isolated per profile ✅ | Shared / NOT isolated ⚠️ |
|---|---|
| `config.yaml` | The Hermes installation itself (same binary/code) |
| `.env` (API keys) | Bundled skill **updates** (these auto-sync across all profiles) |
| `SOUL.md` (personality/identity) | |
| Memories | |
| Session database | |
| Skills directory | |
| Cron jobs | |
| Gateway state + PID | |
| State database | |

**The one gotcha that trips people up:** filesystem access is **not** sandboxed by profile on the default local terminal backend. Your `ctf` profile can still read/write anywhere your user account can, same as `study` or `work`. A profile isolates *Hermes' brain* (memory, config, identity), not your hard drive.

If you want a profile locked to a specific folder, set it explicitly:
```yaml
# inside that profile's config.yaml
terminal:
  backend: local
  cwd: /absolute/path/to/project
```
Using `cwd: "."` does NOT mean "the profile directory", it means "wherever you launched the command from". Always use an absolute path if you want predictable behavior. And don't rely on `SOUL.md` alone to enforce a boundary, it guides the model's personality, it doesn't fence off folders.

---

## 3. Full command reference

### Creating profiles
```bash
hermes profile create <name>                        # fresh, blank profile
hermes profile create <name> --clone                  # clone config.yaml, .env, SOUL.md from your CURRENT profile
hermes profile create <name> --clone-from <other>       # clone identity/config from a SPECIFIC other profile
hermes profile create <name> --clone-all                 # full copy: everything, including memories and sessions
```

### Managing profiles
```bash
hermes profile list                    # see every profile you have
hermes profile use <name>              # set the sticky default (plain "hermes" now opens this one)
hermes profile alias <name> --name X   # give a profile a custom command name
hermes profile delete <name> --yes     # permanently delete a profile
```

### Backup and sharing a single profile
```bash
hermes profile export <name> -o <name>-backup.tar.gz    # package one profile
hermes profile import <name>-backup.tar.gz              # restore it (same or different machine)
```

### Installing/sharing a whole agent as a git repo (distribution)
```bash
hermes profile install github.com/someone/their-profile --alias
hermes profile update <name>                             # pull the author's updates, keeps YOUR memories + .env
```
Distributions automatically strip credentials, memories, and sessions when shared, whoever installs it brings their own API keys.

### Backing up literally everything (all profiles at once)
```bash
hermes backup      # zips your whole ~/.hermes/ (config, keys, memories, skills, sessions, all profiles)
hermes import <backup-file>
```

### Targeting a profile without using its alias
```bash
hermes -p <name> chat
hermes --profile=<name> doctor
hermes chat -p <name> -q "hello"     # the -p flag works in any position
```

### Once created, every profile IS its own command
```bash
study chat                                    # start chatting in the study profile
study setup                                    # configure study's model/API keys
study gateway start                             # start study's own messaging bot
study doctor                                     # health check just for study
study skills list                                 # skills installed in study only
study config set model.default anthropic/claude-sonnet-4
```

*(Make sure `~/.local/bin` is on your PATH, that's where these wrapper commands get created.)*

---

## 4. Setting up your three profiles, step by step

### Study profile
```bash
hermes profile create study
study setup
```
Good candidate for a cheaper/faster model since study tasks (summarizing notes, explaining concepts, flashcards) rarely need your most expensive model.

### Work profile
```bash
hermes profile create work
work setup
work config set terminal.cwd /home/you/work-projects
```
Locking `terminal.cwd` here means Hermes always starts anchored to your actual work folder when you run `work chat`.

### CTF profile
```bash
hermes profile create ctf
ctf setup
ctf config set terminal.cwd /home/you/ctf-challenges
```
This is where you'd install the offensive security stuff we set up earlier (the web-pentest skill, the nmap/nuclei/sqlmap MCP servers), and only here:
```bash
ctf skills install official/security/web-pentest
ctf mcp add nmap --command docker --args run -i --rm --cap-add=NET_RAW nmap-mcp:latest
```
Now those tools **only exist inside the ctf profile.** Your study and work profiles never see them, and there's zero risk of Hermes reaching for a pentest tool while you're asking it to help draft a work email.

---

## 5. Daily usage

Jump between them any time:
```bash
study chat
work chat
ctf chat
```

Or pick a sticky default so plain `hermes` opens whichever you use most:
```bash
hermes profile use work
hermes chat        # now opens "work" automatically every time
```

Check what you've got:
```bash
hermes profile list
```

---

## 6. Useful patterns

### Snapshot before a risky change
```bash
hermes profile create work-backup --clone-from work --clone-all
```
Now you have a frozen copy of `work` (memories and all) before you go mess with its config.

### Start a new profile with the same model setup but a clean memory
```bash
hermes profile create new-project --clone
```
`--clone` only copies config/.env/SOUL.md, not memories or sessions, so you keep your API keys and personality but start with a blank slate. Compare that to `--clone-all` above, which is a full snapshot.

### Share your CTF profile setup with a teammate
```bash
hermes profile export ctf -o ctf-setup.tar.gz
# send them the file, they run:
hermes profile import ctf-setup.tar.gz
```
Or, for ongoing collaborative sharing, package it as a proper git distribution instead so updates are just a fetch:
```bash
hermes profile install github.com/you/ctf-toolkit --alias
hermes profile update ctf-toolkit    # later, pulls new versions without touching their memories
```

---

## 7. Messaging bots per profile (if you want Telegram/Discord access to each)

Each profile runs its **own gateway as a separate process** with its own bot token:
```bash
study gateway start
work gateway start
ctf gateway start
```
One important limit: **you cannot share one bot token across two profiles.** Each messaging platform bot token needs exclusive access, if two profiles' gateways try to use the same Telegram bot, the second one just fails to connect. Make a separate bot per profile (for Telegram, talk to @BotFather three times, once per profile).

---

## 8. Cheat sheet & pro tips 💡

- **Filesystem is NOT sandboxed by profile.** This is the #1 misconception. Set `terminal.cwd` explicitly per profile if you want real folder separation, don't assume it's automatic.
- **`--clone` vs `--clone-all`**: clone = config/identity only (fresh memory), clone-all = full snapshot including memories/sessions. Pick based on whether you want a clean slate or a backup.
- **No hard limit on profile count.** Running a dozen profiles is fine, idle ones use zero resources.
- **Bundled skill updates sync automatically across all profiles**, but skills you personally install stay local to that one profile.
- **Distributions strip secrets on purpose**, you can never accidentally leak your API key by sharing a profile as a git repo, credentials/memories/sessions are hardcoded exclusions that can't be overridden.
- **Desktop app users get extra goodies**: concurrent multi-profile sessions running at the same time, plus cross-profile `@session` references so one profile's chat can point at another's session.
- **`hermes backup` vs `hermes profile export`**: backup grabs literally everything (all profiles at once), export packages just the one profile you name. Use backup for "save my whole setup", export for "share just this one agent."
- **Don't test isolation by asking the model "what directory are you in?"**, that's not reliable. If you need a guarantee, check the actual `terminal.cwd` value in that profile's config.yaml.
