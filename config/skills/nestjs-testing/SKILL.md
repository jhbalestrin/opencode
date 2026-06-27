---
name: nestjs-testing
description: Write unit and E2E tests with Jest, Mongoose repository patterns, mocking strategies, and error-path coverage in NestJS. Use when writing NestJS unit tests, Mongoose repository tests with mongodb-memory-server or mockingoose, controller error propagation, E2E error scenarios (400/404/409), getModelToken mocks, or Test.createTestingModule.
license: MIT
compatibility: opencode
metadata:
  source: HoangNguyen0403/agent-skills-standard
  triggers: "**/*.spec.ts, test/**/*.e2e-spec.ts, Test.createTestingModule, supertest, jest, getModelToken, mongodb-memory-server, mockingoose, UserDocument, ProfileDocument, beforeEach, beforeAll, ConflictException, NotFoundException, ParseObjectIdPipe"
---

# NestJS Testing

## Priority: P2 (MAINTENANCE)

## Structure

```
src/**/*.spec.ts      # Unit tests (isolated logic)
test/**/*.e2e-spec.ts # E2E tests (full app flows)
test/helpers/         # Shared test utilities (mongo-memory, createTestApp, mock-mongoose-query)
```

## Unit Testing

- **Setup**: Use `Test.createTestingModule()` with mocked providers
- **Mocks**: Mock all dependencies via `{ provide: X, useValue: mockX }`
- **Pattern**: AAA (Arrange-Act-Assert)
- **Cleanup**: Call `jest.clearAllMocks()` in `afterEach` (mandatory when using mocks)

### Mongoose / repository layer

| Layer | What to mock | Return type to mock | Assert on |
| --- | --- | --- | --- |
| Controller | Service | `User` / `Profile` (API DTO) | Service return value |
| Service | Repository | **`UserDocument` / `ProfileDocument`** | Mapped **`User` / `Profile`** after `toUser` / `toProfile` |
| Repository | **Prefer in-memory Mongo** | Real documents | Document fields |

**Critical**: When mocking a custom repository in service specs, mock **documents** (`_id`, `ObjectId` refs), not API DTOs (`id` string). See [references/strict-typescript-testing.md](references/strict-typescript-testing.md#11-mongoose-document-vs-api-dto-mocks).

Do not mock Mongoose query chains at the service layer. See [references/mongoose-testing.md](references/mongoose-testing.md).

### Controller tests (mocked service)

Cover **happy paths and error propagation** for every controller method that delegates to a service which can throw:

| Controller method | Mock service to throw | Assert |
| --- | --- | --- |
| `create` | `ConflictException` | controller propagates `ConflictException` |
| `findOne` | `NotFoundException` | controller propagates `NotFoundException` |
| `update` | `NotFoundException` | controller propagates `NotFoundException` |
| `remove` | `NotFoundException` | controller propagates `NotFoundException` |

Happy-path-only controller specs are incomplete. See [references/patterns.md](references/patterns.md#controller-error-propagation).

## E2E Testing

- **Database**: Use real test DB — `mongodb-memory-server` for Mongo/Mongoose, or Docker. Never mock DB in E2E.
- **State cleanup**: Mandatory when tests mutate shared state. Use `connection.dropDatabase()` in `afterEach` (Mongoose) or equivalent.
- **App lifecycle**: Create app in `beforeAll`, close in `afterAll`. Match the project's reference E2E file (e.g. `test/app.e2e-spec.ts`).
- **App config**: Apply the same global pipes/middleware as `main.ts` via a shared `configureApp()` / `createTestApp()` helper.
- **Typing**: Use `INestApplication<App>` with `import { App } from 'supertest/types'` — avoids `no-unsafe-argument` on `request(app.getHttpServer())`.
- **Guards**: Override via `.overrideGuard(X).useValue({ canActivate: () => true })`

### E2E error scenarios (required)

Happy-path-only E2E suites are incomplete. For CRUD resources, also cover:

| Request | Condition | Status |
| --- | --- | --- |
| `POST` | duplicate unique field (e.g. email) | `409` |
| `GET /:id` | missing resource | `404` |
| `PATCH /:id` | missing resource | `404` |
| `DELETE /:id` | missing resource | `404` |
| `GET/PATCH/DELETE /:id` | invalid id (pipe validation) | `400` |
| `POST/PATCH` | invalid DTO (class-validator) | `400` |
| `POST/PATCH` | unknown/extra body fields (`forbidNonWhitelisted`) | `400` |

See [references/patterns.md](references/patterns.md#e2e-error-scenarios).

## Strict TypeScript (MANDATORY)

- **No `any`**: Use typed objects, `jest.Mocked<T>`, or `as unknown as T`. Never `as any`.
- **No `eslint-disable`**: Fix underlying type issue. No exceptions.
- **Verify DTO shapes**: Read actual DTO class before writing mock data.
- **Document vs DTO**: Repository mocks use `XxxDocument`; service/controller assertions use `Xxx` API type — never confuse `{ id }` with `{ _id }`.
- **Cast Jest matchers**: Nested `expect.anything()` → `expect.anything() as unknown`.
- **No unused vars**: Only declare variables if referenced in assertions or setup.

## Test Hygiene (Mandatory)

- **Mock cleanup**: `afterEach(() => jest.clearAllMocks())` in unit specs that use `jest.fn()` mocks
- **E2E typing**: `let app: INestApplication<App>` — never plain `INestApplication` with supertest
- **E2E lifecycle**: `beforeAll` / `afterAll` for app init and close — do not recreate the app per test unless the project reference E2E file does
- **Match project reference**: Read existing `test/*.e2e-spec.ts` before writing new E2E files; follow its imports, typing, and lifecycle hooks
- **Shared helpers**: Reuse `test/helpers/mongo-memory.ts`, `create-test-app.ts`, `mock-mongoose-query.ts` — do not duplicate setup

## Anti-Patterns

- **No Private Tests**: Test via public methods, not `service['privateMethod']`.
  When coverage requires it, use typed helper (see strict-typescript reference).
- **No DB Mocks in E2E**: Use real DB with cleanup. Mocks defeat E2E purpose.
- **No Shared State**: Call `jest.clearAllMocks()` in `afterEach`. Random failures otherwise.
- **No Resource Leaks**: Always close app and MongoMemoryServer in `afterAll`.
- **No Happy-Path-Only Suites**: Controller unit tests missing error propagation, or E2E missing 400/404/409, are incomplete.
- **No DTO Shape in Repository Mocks**: `{ id, email, name }` is not a `UserDocument` — use document factories (see strict-typescript §11).
- **No Manual Mongoose Chain Mocks Everywhere**: Use in-memory Mongo for repository tests, or shared chain helpers / mockingoose.

## When to use me

Use this skill when writing or refactoring NestJS tests: unit specs, Mongoose repository tests, controller error propagation, E2E error scenarios (400/404/409), `getModelToken` / Model mocking, controller/service TestingModule setup, or supertest HTTP assertions.

## References

Mongoose repository testing (in-memory Mongo, mockingoose, chain helpers):
[references/mongoose-testing.md](references/mongoose-testing.md)

Setup examples, mocking patterns, E2E flows, test builders, coverage config:
[references/patterns.md](references/patterns.md)

Strict-TypeScript patterns (Jest matchers, mock typing, DTO verification):
[references/strict-typescript-testing.md](references/strict-typescript-testing.md)
