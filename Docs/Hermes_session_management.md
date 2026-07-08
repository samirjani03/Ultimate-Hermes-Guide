# Hermes session management cheatsheet — organized as a workflow, not just a command dump. 
    
    SESSION MANAGEMENT CHEATSHEET
    
    1. SEE WHAT YOU HAVE
    
      hermes sessions list              # recent 20 sessions
      hermes sessions list --limit 50   # last 50
      hermes sessions stats             # totals: count, tokens, cost, size on disk
      hermes sessions browse            # interactive TUI picker (search, scroll, resume)
    
    
    2. TAG THE KEEPERS (give meaningful names)
    
      hermes sessions rename abc123 "Building TraceixExplorer"
      hermes sessions rename def456 "Research: Windows PrivEsc"
    
      Or during a session, just type:
      /title Building TraceixExplorer
    
      Pro tip: use consistent prefixes so you can bulk-filter later:
        "Project: TraceixExplorer"
        "Lab: THM Buffer Overflow"
        "Study: Networking Subnetting"
    
    
    3. BACK UP KEEPERS (export before deleting)
    
    Single session as readable markdown
      hermes sessions export abc123 ~/saved-sessions/ --format md
    
    Bulk export by title pattern
      hermes sessions export --title "Project:" ~/saved-sessions/ --format jsonl
    
    Export + auto-delete after verified (clean in one step)
      hermes sessions export abc123 ~/saved-sessions/ --format md --delete-after-verified --yes
    
    Export as trace (for Hugging Face Agent Trace Viewer)
      hermes sessions export abc123 --format trace
    
      Formats: jsonl (machine), md (readable), qmd (Quarto), html, trace
    
    
    4. CLEAN UP JUNK (the safe way)
    
    ALWAYS dry-run first to see what will be deleted
      hermes sessions prune --older-than 7d --dry-run
    
    Delete sessions older than 7 days
      hermes sessions prune --older-than 7d --yes
    
    Delete sessions older than 3 days with "doubt" in the title
      hermes sessions prune --older-than 3d --title "doubt" --dry-run
    
    Delete ONE specific session by ID
      hermes sessions delete abc123 --yes
    
    Soft-hide instead of deleting (recoverable — safer!)
      hermes sessions archive --older-than 7d --dry-run
      hermes sessions archive --older-than 7d --yes
    
      Useful prune filters:
        --older-than 3d | 1w | 2w           # age
        --title "keyword"                    # title contains
        --source cli                         # source (cli, telegram, etc.)
        --cwd /path/to/project               # working directory
        --min-messages 5 --max-messages 20   # message count range
        --min-tokens 1000 --max-tokens 5000  # token range
        --model "deepseek"                   # model name


    5. RESUME KEEPERS
    
    
      hermes --resume abc123                 # by session ID
      hermes --resume "TraceixExplorer"      # by title
      hermes --continue                      # most recent session
      hermes --continue "Traceix"            # most recent matching title
    
      In-session:
      /resume TraceixExplorer
    
    
    PRACTICAL WORKFLOW EXAMPLE
    
    Friday cleanup — archive old junk, keep projects
      hermes sessions list                          # see what's there
      hermes sessions rename xyz789 "Project: MyApp" # tag keepers
      hermes sessions export --title "Project:" ~/backups/ --format md  # back up
      hermes sessions archive --older-than 14d --yes  # soft-hide old stuff
      hermes sessions stats                          # verify
    
    
    QUICK REFERENCE
    
      Goal                    Command
      List sessions           hermes sessions list
      Interactive browser     hermes sessions browse
      Name a session          hermes sessions rename <id> "<name>"
      Name current session    /title <name> (in chat)
      Export as markdown      hermes sessions export <id> ./ --format md
      Delete one session      hermes sessions delete <id> --yes
      Delete old junk         hermes sessions prune --older-than 7d --yes
      Soft-hide (reversible)  hermes sessions archive --older-than 7d --yes
      Dry-run preview         hermes sessions prune --older-than 7d --dry-run
      Resume a session        hermes --resume <id or title>
      Resume most recent      hermes --continue
      See stats               hermes sessions stats
    
    
    One thing to know: archive is the safer cleanup option — sessions get hidden but stay in the database. prune permanently deletes. Start with
    archive until you're sure, then prune later.
