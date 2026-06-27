# Mongoose Testing Patterns

Patterns for testing NestJS apps using `@nestjs/mongoose` and a repository layer.

## Testing layers (do not mock Mongoose everywhere)

| Layer | Mock | Approach |
| --- | --- | --- |
| Controller | `UsersService` | `useValue` with `jest.fn()` |
| Service | `UsersRepository` | `useValue` with `jest.fn()` |
| Repository | **Prefer real DB** | `mongodb-memory-server` |
| Repository (alternative) | `Model` | `mockingoose` or chain helpers |
| E2E / HTTP | Nothing | Real app + in-memory or Docker Mongo |

**Do not** mock Mongoose query chains at the service layer when a repository abstraction exists — mock the repository instead.

**Do not** hand-mock `.find().sort().exec()` in every test — use a shared helper or in-memory Mongo.

---

## Service specs: mock documents, assert DTOs

When the service maps repository documents through a mapper (`toUser`, `toProfile`), repository mocks must return **document** shapes. Service assertions use **API DTO** shapes.

```
Repository.findById() → UserDocument { _id, email, name }
        ↓ toUser(doc)
Service.findOne()     → User { id, email, name }
```

### Document factory helpers

Place in `test/helpers/` or next to the spec. Cast through `unknown` — never `as any`.

```typescript
// test/helpers/mock-documents.ts
import { Types } from 'mongoose';
import { UserDocument } from '../../src/users/schemas/user.schema';
import { ProfileDocument } from '../../src/profiles/schemas/profile.schema';

export function createMockUserDocument(
  overrides: { id?: string; email?: string; name?: string } = {},
): UserDocument {
  return {
    _id: new Types.ObjectId(overrides.id ?? '507f1f77bcf86cd799439011'),
    email: overrides.email ?? 'test@example.com',
    name: overrides.name ?? 'Test User',
  } as unknown as UserDocument;
}

export function createMockProfileDocument(
  overrides: { id?: string; userId?: string; bio?: string } = {},
): ProfileDocument {
  return {
    _id: new Types.ObjectId(overrides.id ?? '507f1f77bcf86cd799439012'),
    userId: new Types.ObjectId(overrides.userId ?? '507f1f77bcf86cd799439011'),
    bio: overrides.bio ?? 'Test bio',
  } as unknown as ProfileDocument;
}

/** Expected API shape after toUser(doc) */
export function toExpectedUser(doc: UserDocument) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
  };
}

/** Expected API shape after toProfile(doc) */
export function toExpectedProfile(doc: ProfileDocument) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    bio: doc.bio,
  };
}
```

### ProfilesService example (correct)

```typescript
const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockUsersService = { findOne: jest.fn() };

// providers: ProfilesService, { provide: ProfilesRepository, useValue: mockRepository }, ...

it('findAll returns mapped profiles', async () => {
  const doc = createMockProfileDocument({ bio: 'Hello' });
  mockRepository.findAll.mockResolvedValue([doc]);

  const result = await service.findAll();

  expect(result).toEqual([toExpectedProfile(doc)]);
});

it('create validates user then maps document', async () => {
  const dto = { userId: '507f1f77bcf86cd799439011', bio: 'New bio' };
  const user = { id: dto.userId, email: 'a@test.com', name: 'A' };
  const doc = createMockProfileDocument({ userId: dto.userId, bio: dto.bio });

  mockUsersService.findOne.mockResolvedValue(user);
  mockRepository.findByUserId.mockResolvedValue(null);
  mockRepository.create.mockResolvedValue(doc);

  const result = await service.create(dto);

  expect(result).toEqual(toExpectedProfile(doc));
});
```

### Common error (do not do this)

```typescript
// ❌ WRONG — Profile DTO passed to repository mock; TS error + runtime crash in toProfile
repository.findAll.mockResolvedValue([{ id: '1', userId: '2', bio: 'Test' }]);
repository.findById.mockResolvedValue({ id: '1', userId: '2', bio: 'Test' });

// ❌ WRONG — asserting DTO when service never returned unmapped mock
expect(result).toEqual(mockProfile);
```

`toProfile` calls `doc._id.toString()` — plain `{ id: '1' }` objects fail at runtime even if forced through types.

### When each type applies

| Mock target | Use type | Example fields |
| --- | --- | --- |
| `UsersRepository.findById` | `UserDocument \| null` | `_id`, `email`, `name` |
| `ProfilesRepository.findByUserId` | `ProfileDocument \| null` | `_id`, `userId` (ObjectId), `bio` |
| `UsersService.findOne` | `User` | `id` (string), `email`, `name` |
| Controller / HTTP assertions | `User` / `Profile` | `id`, not `_id` |

Read the mapper file (`mappers/*.mapper.ts`) before writing service specs — it defines the document → DTO field mapping.

---

## Option A (recommended): In-memory Mongo for repository tests

Fast, reliable, no chain mocking. Uses `mongodb-memory-server` (devDependency).

### Helpers

```typescript
// test/helpers/mongo-memory.ts
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function startMongoMemoryServer(): Promise<MongoMemoryServer> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  return mongod;
}
```

```typescript
// test/helpers/create-test-app.ts — E2E only; apply same configureApp as main.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/setup-app';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
```

### Repository spec scaffold

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UsersRepository } from './users.repository';
import { UserEntity, UserSchema } from './schemas/user.schema';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mongod: MongoMemoryServer;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
      ],
      providers: [UsersRepository],
    }).compile();
    repository = module.get(UsersRepository);
  });

  afterEach(async () => {
    const connection = module.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
  });

  afterAll(async () => {
    await module.close();
    await mongod.stop();
  });

  it('findById returns null for invalid ObjectId without querying', async () => {
    const result = await repository.findById('not-valid');
    expect(result).toBeNull();
  });

  it('create and findByEmail persist document', async () => {
    const doc = await repository.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    const found = await repository.findByEmail('test@example.com');
    expect(found?._id.toString()).toBe(doc._id.toString());
  });
});
```

Set `MONGODB_URI` **before** `Test.createTestingModule` when using `MongooseModule.forRootAsync` in `AppModule`.

### E2E / integration cleanup

```typescript
afterEach(async () => {
  const connection = app.get<Connection>(getConnectionToken());
  await connection.dropDatabase();
});
```

App lifecycle stays in `beforeAll` / `afterAll`. Reset data in `afterEach`.

---

## Option B: mockingoose (pure unit, no DB)

Use when repository tests must not start MongoDB. [mockingoose](https://www.npmjs.com/package/mockingoose) intercepts Model calls and handles `.exec()` chains.

Requires Mongoose 9+ and Node 18+.

```typescript
import mockingoose from 'mockingoose';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity, UserDocument } from './schemas/user.schema';
import { UsersRepository } from './users.repository';

describe('UsersRepository (mockingoose)', () => {
  let repository: UsersRepository;
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    mockingoose.resetAll();
    const module = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken(UserEntity.name),
          useValue: Model<UserDocument>,
        },
      ],
    }).compile();
    repository = module.get(UsersRepository);
    userModel = module.get(getModelToken(UserEntity.name));
  });

  it('findAll returns mocked documents', async () => {
    const docs = [{ email: 'a@test.com', name: 'A' }];
    mockingoose(userModel).toReturn(docs, 'find');

    const result = await repository.findAll();
    expect(result).toHaveLength(1);
  });
});
```

Prefer `mockingoose(Model).toReturn(value, 'findOne' | 'find' | 'save' | ...)` over manual chain mocks.

Reset between tests: `mockingoose.resetAll()` in `beforeEach`.

---

## Option C: Manual Model mock with chain helpers

Use when you cannot add `mockingoose` or need fine-grained call assertions. Extract helpers — never repeat chains inline.

```typescript
// test/helpers/mock-mongoose-query.ts
export function mockExec<T>(value: T) {
  return { exec: jest.fn().mockResolvedValue(value) };
}

export function mockSortExec<T>(value: T) {
  return { sort: jest.fn().mockReturnValue(mockExec(value)) };
}

export function createMockUserModel() {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };
}

export function mockModelConstructor(saveResult: unknown) {
  const save = jest.fn().mockResolvedValue(saveResult);
  return jest.fn().mockImplementation(() => ({ save }));
}
```

### DI with getModelToken

Token must match `@InjectModel(Entity.name)` exactly:

```typescript
import { getModelToken } from '@nestjs/mongoose';

const mockUserModel = createMockUserModel();

Test.createTestingModule({
  providers: [
    UsersRepository,
    { provide: getModelToken(UserEntity.name), useValue: mockUserModel },
  ],
});
```

### Chain examples (official NestJS mongoose sample style)

```typescript
// find().sort().exec()
mockUserModel.find.mockReturnValue(mockSortExec([doc]));

// findById().exec()
mockUserModel.findById.mockReturnValue(mockExec(doc));

// findByIdAndUpdate().exec()
mockUserModel.findByIdAndUpdate.mockReturnValue(mockExec(updatedDoc));

// deleteOne().exec()
mockUserModel.deleteOne.mockReturnValue(mockExec({ deletedCount: 1 }));

// new model().save() — mock constructor on useValue factory
const MockModel = mockModelConstructor(doc);
providers: [
  UsersRepository,
  { provide: getModelToken(UserEntity.name), useValue: MockModel },
];
```

Cast query return values through `unknown` when ESLint strict mode requires it:

```typescript
mockUserModel.find.mockReturnValue(
  mockSortExec([doc]) as unknown as ReturnType<typeof mockUserModel.find>,
);
```

---

## Decision guide

| Situation | Use |
| --- | --- |
| Testing `UsersRepository` / `ProfilesRepository` | **Option A** in-memory Mongo |
| Testing `UsersService` | Mock `UsersRepository` (no Mongoose) |
| Testing `UsersController` | Mock `UsersService` (no Mongoose) |
| CI forbids memory server / must be pure unit | **Option B** mockingoose |
| Legacy project, no new deps | **Option C** chain helpers |

---

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Mocking Model at service layer | Mock repository instead |
| Rewriting `.find().sort().exec()` in every test | Use `mockSortExec` helper or in-memory Mongo |
| Wrong DI token | Use `getModelToken(Entity.name)`, not a plain string |
| `new this.model()` fails in tests | Mock constructor with `mockModelConstructor` or use mockingoose |
| ObjectId query mismatch | Cast string ids: `{ userId: new Types.ObjectId(id) }` |
| Stale data between repo tests | `connection.dropDatabase()` in `afterEach` |
| E2E missing ValidationPipe | Share `configureApp()` via `createTestApp` helper |
| Repository mock uses `{ id }` in service spec | Use document factory with `_id` + `ObjectId` — see Service specs section |
| Service spec asserts unmapped mock object | Assert mapped DTO via `toExpectedUser(doc)` / `toExpectedProfile(doc)` |
| "Can't mock repository due to types" | Wrong shape — not a DI issue; use document factories |
