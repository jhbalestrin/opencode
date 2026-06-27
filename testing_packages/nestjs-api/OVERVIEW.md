# nestjs-api — Project Overview

NestJS playground for testing the OpenCode **nestjs-testing** skill. Forked from [nestjs/typescript-starter](https://github.com/nestjs/typescript-starter) and extended with MongoDB-backed `users` and `profiles` CRUD modules.

## Architecture

```
main.ts → AppModule
            ├── DatabaseModule (Mongoose connection)
            ├── UsersModule
            │     ├── UsersController  → UsersService → UsersRepository → UserEntity
            │     └── dto/, schemas/, mappers/
            ├── ProfilesModule
            │     ├── ProfilesController → ProfilesService → ProfilesRepository → ProfileEntity
            │     └── dto/, schemas/, mappers/ (depends on UsersModule)
            ├── AppController → AppService
            └── Middleware (global): RequestContext → JsonBody → RequestLogger
```

### Layer responsibilities

| Layer | Role |
|-------|------|
| **Controller** | HTTP routing, param validation via `ParseObjectIdPipe`, delegates to service |
| **Service** | Business logic, exception mapping (`NotFoundException`, `ConflictException`), DTO ↔ domain mapping |
| **Repository** | Mongoose data access; returns documents, not DTOs |
| **Mapper** | Pure functions (`toUser`, `toProfile`) converting Mongoose documents to response interfaces |
| **Schema** | Mongoose entity definitions with `@Schema` / `@Prop` |
| **DTO** | Request validation with `class-validator` decorators |

### Cross-cutting concerns

- **`setup-app.ts`** — Applies global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform).
- **`ParseObjectIdPipe`** — Validates MongoDB ObjectId route params; throws `400 Bad Request` on invalid IDs.
- **Middleware stack** (applied to all routes in `AppModule`):
  - `RequestContextMiddleware` — Sets `requestId` (from `x-request-id` header or UUID) and `requestStartedAt`.
  - `JsonBodyMiddleware` — Requires `Content-Type: application/json` for POST/PUT/PATCH.
  - `RequestLoggerMiddleware` — Logs request duration; sets `x-response-time-ms` header.

### Database

- **Driver:** Mongoose via `@nestjs/mongoose`
- **Default URI:** `mongodb://127.0.0.1:27017/nestjs-api` (overridable via `MONGODB_URI`)
- **Collections:** `users`, `profiles`
- **Relations:** `ProfileEntity.userId` references `UserEntity` (one profile per user, enforced by unique index)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Hello World |
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user `{ email, name }` |
| PATCH | `/users/:id` | Update user `{ name? }` |
| DELETE | `/users/:id` | Delete user → `{ deleted: true }` |
| GET | `/profiles` | List all profiles |
| GET | `/profiles/:id` | Get profile by ID |
| GET | `/profiles/user/:userId` | Get profile for a user |
| POST | `/profiles` | Create profile `{ userId, bio }` |
| PATCH | `/profiles/:id` | Update profile `{ bio? }` |
| DELETE | `/profiles/:id` | Delete profile → `{ deleted: true }` |

---

## Source Files

### Entry & bootstrap

| File | Purpose |
|------|---------|
| `src/main.ts` | Creates Nest app, calls `configureApp`, listens on port 3000 |
| `src/app.module.ts` | Root module; imports feature modules, registers middleware |
| `src/setup-app.ts` | Shared app configuration (global ValidationPipe) |

### App (starter)

| File | Purpose |
|------|---------|
| `src/app.controller.ts` | Root GET `/` handler |
| `src/app.service.ts` | Returns `"Hello World!"` |

### Database

| File | Purpose |
|------|---------|
| `src/database/database.module.ts` | `MongooseModule.forRootAsync` with env-based URI |

### Users module

| File | Purpose |
|------|---------|
| `src/users/users.module.ts` | Registers controller, service, repository, Mongoose feature |
| `src/users/users.controller.ts` | CRUD routes under `/users` |
| `src/users/users.service.ts` | Business logic; email uniqueness, not-found handling |
| `src/users/users.repository.ts` | Mongoose queries (findAll, findById, findByEmail, create, update, delete) |
| `src/users/dto/user.dto.ts` | `CreateUserDto`, `UpdateUserDto`, `User` interface |
| `src/users/schemas/user.schema.ts` | `UserEntity` Mongoose schema (email unique, lowercase) |
| `src/users/mappers/user.mapper.ts` | `toUser()` document → response mapping |

### Profiles module

| File | Purpose |
|------|---------|
| `src/profiles/profiles.module.ts` | Imports `UsersModule`; registers profile feature |
| `src/profiles/profiles.controller.ts` | CRUD routes under `/profiles` |
| `src/profiles/profiles.service.ts` | Validates user exists; one-profile-per-user constraint |
| `src/profiles/profiles.repository.ts` | Mongoose queries including `findByUserId` |
| `src/profiles/dto/profile.dto.ts` | `CreateProfileDto`, `UpdateProfileDto`, `Profile` interface |
| `src/profiles/schemas/profile.schema.ts` | `ProfileEntity` with `userId` ref to `UserEntity` |
| `src/profiles/mappers/profile.mapper.ts` | `toProfile()` document → response mapping |

### Common

| File | Purpose |
|------|---------|
| `src/common/pipes/parse-object-id.pipe.ts` | Validates MongoDB ObjectId params |
| `src/common/middleware/request-context.middleware.ts` | Request ID and timing context |
| `src/common/middleware/json-body.middleware.ts` | JSON content-type enforcement |
| `src/common/middleware/request-logger.middleware.ts` | HTTP logging and response timing |
| `src/common/types/request-context.ts` | `RequestWithContext` type and helper |

---

## Test Suite

### Test framework & configuration

| Setting | Value |
|---------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Unit config** | Inline in `package.json` → `jest` key |
| **E2E config** | `test/jest-e2e.json` |
| **Unit rootDir** | `src/` (matches `*.spec.ts`) |
| **E2E rootDir** | `.` (matches `*.e2e-spec.ts`) |
| **Environment** | `node` |

### Test scripts

```bash
npm test              # unit tests
npm run test:watch    # unit tests (watch)
npm run test:cov      # unit tests with coverage
npm run test:e2e      # e2e tests
npm run test:debug    # Jest with Node inspector
```

### Coverage configuration

Defined in `package.json` under `jest`:

- **Output directory:** `coverage/`
- **Collect from:** `src/**/*.(t|j)s`
- **Excluded:** `*.module.ts`, `main.ts`, `*.dto.ts`, `*.schema.ts`
- **Thresholds (global):** 80% branches, functions, lines, statements

No `.nycrc` or Vitest config present.

### Testing dependencies

| Package | Usage |
|---------|-------|
| `@nestjs/testing` | `Test.createTestingModule()` for unit/integration tests |
| `jest` / `ts-jest` | Test runner and TypeScript transform |
| `@types/jest` | Jest type definitions |
| `supertest` / `@types/supertest` | HTTP assertions in e2e tests |
| `mongodb-memory-server` | In-memory MongoDB for repository unit tests and e2e |

### E2E test helpers (`test/helpers/`)

| File | Purpose |
|------|---------|
| `create-test-app.ts` | Bootstraps full `AppModule` with `configureApp` |
| `mongo-memory.ts` | Starts `MongoMemoryServer`, sets `MONGODB_URI` |
| `mock-documents.ts` | Factory helpers for mock User/Profile documents |
| `parse-response.ts` | Type-safe response body parsers for e2e assertions |

---

## Unit Tests (`src/**/*.spec.ts`)

| File | Covers |
|------|--------|
| `app.controller.spec.ts` | `AppController.getHello()` |
| `app.service.spec.ts` | `AppService` definition and `getHello()` |
| `setup-app.spec.ts` | `configureApp` applies global ValidationPipe |
| `users/users.service.spec.ts` | All service methods with mocked repository |
| `users/users.controller.spec.ts` | All controller methods with mocked service |
| `users/users.repository.spec.ts` | Full CRUD against in-memory MongoDB |
| `users/mappers/user.mapper.spec.ts` | `toUser()` mapping |
| `profiles/profiles.service.spec.ts` | All service methods with mocked repo + UsersService |
| `profiles/profiles.controller.spec.ts` | All controller methods with mocked service |
| `profiles/profiles.repository.spec.ts` | Full CRUD against in-memory MongoDB |
| `profiles/mappers/profile.mapper.spec.ts` | `toProfile()` mapping |
| `common/pipes/parse-object-id.pipe.spec.ts` | Valid/invalid ObjectId handling |
| `common/middleware/request-context.middleware.spec.ts` | Request ID generation and header passthrough |
| `common/middleware/json-body.middleware.spec.ts` | Content-type enforcement by HTTP method |
| `common/middleware/request-logger.middleware.spec.ts` | Logging hooks and response timing header |

---

## E2E Tests (`test/*.e2e-spec.ts`)

| File | Covers |
|------|--------|
| `app.e2e-spec.ts` | GET `/` returns Hello World |
| `users.e2e-spec.ts` | Users CRUD happy paths, validation, middleware headers; basic profile creation |
| `users-error.e2e-spec.ts` | Duplicate email (409), missing resources (404), invalid IDs (400), validation errors, non-JSON (415) |
| `profiles-crud.e2e-spec.ts` | Full profiles CRUD, duplicate profile (409), error cases, validation |

All e2e tests use `mongodb-memory-server` and drop the database between tests.

---

## TypeScript Configuration

| File | Notes |
|------|-------|
| `tsconfig.json` | Target ES2023, `nodenext` modules, decorators enabled, strict casing |
| `tsconfig.build.json` | Extends base; excludes `test/`, `**/*spec.ts`, `node_modules`, `dist` |

---

## Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | NestJS framework |
| `@nestjs/mongoose` | Mongoose integration |
| `mongoose` | MongoDB ODM |
| `class-validator`, `class-transformer` | DTO validation (via ValidationPipe) |
| `reflect-metadata`, `rxjs` | NestJS runtime requirements |

---

## Quick Start

```bash
npm install
npm run start:dev    # dev server on :3000
npm test             # unit tests
npm run test:e2e     # e2e tests
npm run test:cov     # coverage report
```
