# nestjs-api

NestJS playground for testing the OpenCode **nestjs-testing** skill.

Forked from the official [nestjs/typescript-starter](https://github.com/nestjs/typescript-starter) and extended with a `users` CRUD module.

## Quick start

```bash
npm install
npm run start:dev
npm test
npm run test:e2e
```

API (default port 3000):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Hello World |
| GET | `/users` | List users |
| GET | `/users/:id` | Get user |
| POST | `/users` | Create user `{ "email", "name" }` |
| PATCH | `/users/:id` | Update user `{ "name"? }` |
| DELETE | `/users/:id` | Delete user |

## Skill practice targets

These files exist but have **no tests yet** — use them with the `nestjs-testing` skill:

- `src/users/users.service.ts` — unit tests (mock-free, in-memory store)
- `src/users/users.controller.ts` — unit tests with mocked `UsersService`
- `test/users.e2e-spec.ts` — create this file for E2E flows

Existing reference tests:

- `src/app.controller.spec.ts` — minimal unit test example
- `test/app.e2e-spec.ts` — minimal E2E example

## OpenCode

Global skill: `nestjs-testing` (from this repo's `config/skills/` via `make sync`).

Example prompt:

```text
In testing_packages/nestjs-api, write unit tests for UsersService. use nestjs-testing
```

## License

MIT (from nestjs/typescript-starter)
