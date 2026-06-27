# Testing packages

Playground projects for validating OpenCode config, skills, and agents.

| Package | Purpose |
|---------|---------|
| [nestjs-api](./nestjs-api) | NestJS REST API — exercise the global `nestjs-testing` skill |

## nestjs-api skill exercises

From the repo root or this package:

```bash
cd testing_packages/nestjs-api
npm install
npm test
npm run test:e2e
```

OpenCode prompts to try (uses global skill at `~/.config/opencode/skills/nestjs-testing/`):

- *"Write unit tests for UsersService following nestjs-testing"*
- *"Add controller tests for UsersController with mocked UsersService"*
- *"Add E2E tests for POST /users and GET /users/:id using supertest"*

The `users` module ships **without** spec files on purpose — that is the main skill practice target.

## Source

Based on the official [nestjs/typescript-starter](https://github.com/nestjs/typescript-starter) (MIT).
