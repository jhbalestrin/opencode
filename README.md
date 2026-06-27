# opencode

Global [OpenCode](https://opencode.ai) configuration managed as dotfiles. This repo is the source of truth; `make sync` symlinks files into `~/.config/opencode/`.

## Prerequisites

- OpenCode CLI installed (`~/.opencode/bin/opencode` or on PATH)
- npm (for plugin dependencies)

## Quick start

```bash
git clone git@github.com:jhbalestrin/opencode.git
cd opencode
make sync
```

On a machine with existing config, bootstrap first:

```bash
make bootstrap   # one-time: import live config into config/
make sync        # link + npm ci
```

## Commands

| Command | Description |
|---------|-------------|
| `make sync` | Recreate symlinks and run `npm ci` (primary day-to-day command) |
| `make status` | Show symlink health and drift |
| `make bootstrap` | Import existing `~/.config/opencode` into `config/` |
| `make unlink` | Remove symlinks managed by this repo |
| `make clean-stale` | Remove orphan symlinks whose repo source was deleted |

## Layout

```
config/
├── opencode.jsonc      # main config
├── package.json        # npm plugins (@opencode-ai/plugin)
├── agents/             # custom agents
├── commands/           # custom commands
├── plugins/            # local plugins
├── skills/
├── themes/
└── modes/
```

## Secrets

Do not commit API keys. Use either:

- `config/opencode.local.json` (gitignored), or
- `{env:VAR_NAME}` references in `opencode.jsonc`

## Workflow

```bash
vim config/agents/my-agent.md
make sync
git add config/ && git commit -m "Add my-agent"
```

## Out of scope

These are intentionally **not** managed by this repo:

- `~/.opencode/bin/` — CLI binary install
- `~/.local/share/opencode/` — runtime database and sessions
- `~/.cache/opencode/` — cache
- Project-level `.opencode/` directories (belong in each project repo)
