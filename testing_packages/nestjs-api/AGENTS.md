# nestjs-api — Agent Guide

NestJS + MongoDB CRUD playground for testing the OpenCode **nestjs-testing** skill. See [OVERVIEW.md](./OVERVIEW.md) for full architecture, file inventory, and test coverage details.

## Project layout

```
src/
  main.ts, app.module.ts, setup-app.ts
  app.controller.ts, app.service.ts
  database/database.module.ts
  users/          # controller → service → repository → schema
  profiles/       # same pattern; depends on UsersModule
  common/
    pipes/        # ParseObjectIdPipe
    middleware/   # request context, JSON body, logger
    types/        # RequestWithContext
test/
  *.e2e-spec.ts   # full-app HTTP tests
  helpers/        # createTestApp, mongo-memory, parse-response
```

## Architecture conventions

- **Layered modules:** Controller → Service → Repository → Mongoose schema.
- **DTOs** (`*.dto.ts`) handle request validation; **interfaces** in the same file define response shapes.
- **Mappers** (`toUser`, `toProfile`) are pure functions — no DI, easy to unit test.
- **Repositories** return Mongoose documents; services map to DTOs/interfaces and throw Nest exceptions.
- **Global middleware** is registered in `AppModule.configure()` — order matters: context → JSON body → logger.
- **App bootstrap** is split: `main.ts` creates the app; `setup-app.ts` applies shared config (ValidationPipe). E2E tests use `createTestApp()` which mirrors production setup.

## When editing code

- Match existing patterns in the nearest module (users and profiles are parallel).
- Use `ParseObjectIdPipe` for `:id` and `:userId` route params.
- Throw `NotFoundException`, `ConflictException`, or let ValidationPipe handle `400`.
- Do not put business logic in controllers or repositories.
- After changes, run `npm test` and `npm run test:e2e`.

## Testing guide

### Commands

```bash
npm test              # unit tests (src/**/*.spec.ts)
npm run test:cov      # unit tests + coverage (80% threshold)
npm run test:e2e      # e2e tests (test/**/*.e2e-spec.ts)
```

### Unit test patterns

| Layer | Pattern |
|-------|---------|
| **Service** | Mock repository with `useValue`; test business logic and exceptions |
| **Controller** | Mock service with `useValue`; test delegation and exception propagation |
| **Repository** | Use `mongodb-memory-server` + `MongooseModule.forRoot` in `beforeAll` |
| **Mapper / Pipe / Middleware** | Direct instantiation, no TestingModule needed |

### E2E test patterns

- Start in-memory MongoDB via `startMongoMemoryServer()` (sets `MONGODB_URI`).
- Bootstrap with `createTestApp()` from `test/helpers/create-test-app.ts`.
- Drop database in `afterEach` using `getConnectionToken()`.
- Parse response bodies with `parseUserBody` / `parseProfileBody` helpers.
- Assert middleware headers: `x-request-id`, `x-response-time-ms`.

### Coverage rules (package.json jest config)

- Collected from `src/**` excluding `*.module.ts`, `main.ts`, `*.dto.ts`, `*.schema.ts`.
- Global threshold: **80%** for branches, functions, lines, statements.

### Key test dependencies

`@nestjs/testing`, `jest`, `ts-jest`, `supertest`, `mongodb-memory-server`

## API quick reference

| Method | Path | Body |
|--------|------|------|
| GET | `/` | — |
| GET/POST/PATCH/DELETE | `/users`, `/users/:id` | `{ email, name }` / `{ name? }` |
| GET/POST/PATCH/DELETE | `/profiles`, `/profiles/:id` | `{ userId, bio }` / `{ bio? }` |
| GET | `/profiles/user/:userId` | — |

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
