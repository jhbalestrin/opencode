# opencode

Global [OpenCode](https://opencode.ai) configuration managed as dotfiles. This repo is the source of truth; `make sync` symlinks files into `~/.config/opencode/`.

## Prerequisites

- OpenCode CLI installed (`~/.opencode/bin/opencode` or on PATH)
- npm (for plugin dependencies)
- [uv](https://docs.astral.sh/uv/) (for Graphify — `uv tool install graphifyy`)

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
| `make install-graphify` | Install `graphifyy` CLI and refresh the OpenCode skill |
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

## Graphify

[Graphify](https://github.com/safishamsi/graphify) maps a codebase into a queryable knowledge graph. Global skill and hook plugin live under `config/skills/graphify/` and `config/plugins/graphify.js`.

**One-time machine setup:**

```bash
make install-graphify   # or: uv tool install "graphifyy[sql,mcp]"
make sync
```

**Per-project usage** (in each codebase, not this repo):

```bash
/graphify .                              # in OpenCode
graphify extract . --no-viz              # headless, code-only (offline AST)
graphify query "how does auth work?"     # after graph exists
```

Graph artifacts go in `graphify-out/` inside each project. Commit `graphify-out/` for team sharing; keep `graphify-out/cost.json` gitignored.

Upgrade Graphify: `uv tool upgrade graphifyy` then re-run `graphify install --platform opencode` and copy any changed skill files into `config/`.

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
