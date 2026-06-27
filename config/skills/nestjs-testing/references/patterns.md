# NestJS Testing Patterns Reference

Detailed examples and advanced patterns for NestJS testing.

## Unit Testing Patterns

### AAA Pattern Example

```typescript
describe('UserService', () => {
  it('should create user', async () => {
    // Arrange
    const dto = { email: 'test@test.com', password: 'Pass123!' };
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: 1, ...dto });

    // Act
    const result = await service.createUser(dto);

    // Assert
    expect(result.email).toBe(dto.email);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Service tests (mocked repository)

When the service depends on a custom repository (not Mongoose Model directly), mock the repository with **document** shapes. Assert on mapped **API DTOs**. See [mongoose-testing.md § Service specs](mongoose-testing.md#service-specs-mock-documents-assert-dtos).

```typescript
describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user', async () => {
    const doc = createMockUserDocument();
    mockUsersRepository.findByEmail.mockResolvedValue(null);
    mockUsersRepository.create.mockResolvedValue(doc);

    const result = await service.create({ email: 'test@test.com', name: 'Test User' });

    expect(result).toEqual(toExpectedUser(doc));
    expect(mockUsersRepository.create).toHaveBeenCalled();
  });
});
```

For Mongoose Model / repository layer testing, see [mongoose-testing.md](mongoose-testing.md).

### Testing Services

```typescript
describe('AuthService', () => {
  let service: AuthService;
  const mockUsersService = { findByEmail: jest.fn(), update: jest.fn() };
  const mockJwtService = { sign: jest.fn(), verify: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should validate user', async () => {
    const user = { id: 1, email: 'test@test.com', password: 'hashed' };
    mockUsersService.findByEmail.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

    const result = await service.validateUser('test@test.com', 'pass');

    expect(result).toEqual({ userId: 1, email: 'test@test.com' });
  });
});
```

### Testing Controllers (Mocked Service)

```typescript
describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delegate findAll to service', () => {
    const users = [{ id: 1, email: 'a@test.com', name: 'A' }];
    mockUsersService.findAll.mockReturnValue(users);

    expect(controller.findAll()).toEqual(users);
    expect(mockUsersService.findAll).toHaveBeenCalled();
  });
});
```

### Controller Error Propagation

When the controller delegates to the service without catching, mock the service to throw and assert the controller propagates the exception. Required for `create`, `findOne`, `update`, and `remove`.

```typescript
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('Error propagation', () => {
  it('create should propagate ConflictException', () => {
    mockUsersService.create.mockImplementation(() => {
      throw new ConflictException('Email already registered');
    });
    const dto = { email: 'dup@test.com', name: 'Dup' };

    expect(() => controller.create(dto)).toThrow(ConflictException);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('findOne should propagate NotFoundException', () => {
    mockUsersService.findOne.mockImplementation(() => {
      throw new NotFoundException('User not found');
    });

    expect(() => controller.findOne('507f1f77bcf86cd799439011')).toThrow(NotFoundException);
  });

  it('update should propagate NotFoundException', () => {
    mockUsersService.update.mockImplementation(() => {
      throw new NotFoundException('User not found');
    });

    expect(() => controller.update('507f1f77bcf86cd799439011', { name: 'X' })).toThrow(NotFoundException);
  });

  it('remove should propagate NotFoundException', () => {
    mockUsersService.remove.mockImplementation(() => {
      throw new NotFoundException('User not found');
    });

    expect(() => controller.remove('507f1f77bcf86cd799439011')).toThrow(NotFoundException);
  });
});
```

Prefer typed mock object literals over `Partial<jest.Mocked<T>>` with repeated `as jest.Mock` casts.

### Testing Guards

```typescript
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const mockReflector = { getAllAndOverride: jest.fn() };

  beforeEach(() => {
    guard = new JwtAuthGuard(mockReflector as unknown as Reflector);
  });

  it('should allow public routes', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });
});

function createMockContext() {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 1 } }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}
```

### Test Data Builders

```typescript
class UserBuilder {
  private user = {
    email: 'test@test.com',
    password: 'hashed',
    role: 'USER',
  };

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRole(role: string): this {
    this.user.role = role;
    return this;
  }

  build() {
    return this.user;
  }
}

// Usage
const admin = new UserBuilder().withRole('ADMIN').build();
```

## E2E Testing Patterns

### E2E Scaffold (Match Project Reference)

Before writing E2E tests, read the project's existing `test/*.e2e-spec.ts` and match its imports, typing, and lifecycle hooks.

```typescript
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // tests...
});
```

**Do not** use plain `INestApplication` — it triggers `@typescript-eslint/no-unsafe-argument` on `request(app.getHttpServer())`.

**Do not** recreate the app in `beforeEach` unless the project reference E2E file does. Default is `beforeAll` / `afterAll`.

### E2E Error Scenarios

Happy-path CRUD tests alone are incomplete. Add a `describe('Error cases')` block:

```typescript
describe('Error cases', () => {
  const dto = { email: 'test@example.com', name: 'Test User' };

  it('POST /users duplicate email → 409', async () => {
    await request(app.getHttpServer()).post('/users').send(dto).expect(201);
    await request(app.getHttpServer()).post('/users').send(dto).expect(409);
  });

  it('GET /users/:id missing → 404', () => {
    return request(app.getHttpServer())
      .get('/users/507f1f77bcf86cd799439011')
      .expect(404);
  });

  it('PATCH /users/:id missing → 404', () => {
    return request(app.getHttpServer())
      .patch('/users/507f1f77bcf86cd799439011')
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('DELETE /users/:id missing → 404', () => {
    return request(app.getHttpServer())
      .delete('/users/507f1f77bcf86cd799439011')
      .expect(404);
  });

  it('GET /users/:id invalid id → 400', () => {
    return request(app.getHttpServer()).get('/users/abc').expect(400);
  });

  it('PATCH /users/:id invalid id → 400', () => {
    return request(app.getHttpServer())
      .patch('/users/abc')
      .send({ name: 'Bad' })
      .expect(400);
  });

  it('DELETE /users/:id invalid id → 400', () => {
    return request(app.getHttpServer()).delete('/users/abc').expect(400);
  });
});
```

Map exceptions to status codes: `NotFoundException` → 404, `ConflictException` → 409, invalid ObjectId / pipe failure → 400, class-validator failure → 400.

When tests mutate shared in-memory or DB state within a suite, reset in `afterEach` (truncate/rollback). App lifecycle stays in `beforeAll` / `afterAll`.

### Complete User Flow (Auth Example)

```typescript
describe('Auth Flow (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'Pass123!' })
      .expect(201)
      .expect((res) => {
        accessToken = res.body.access_token;
      });
  });

  it('should access protected route', () => {
    return request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
```

### Database Cleanup (Mongoose)

Use `mongodb-memory-server` for E2E and repository tests. Reset collections between tests:

```typescript
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

afterEach(async () => {
  const connection = app.get<Connection>(getConnectionToken());
  await connection.dropDatabase();
});
```

For repository-only specs (no HTTP app), get connection from the testing module the same way.

See [mongoose-testing.md](mongoose-testing.md) for full scaffold and helpers.

### Override Providers

```typescript
// Bypass authentication
beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

  app = module.createNestApplication();
  await app.init();
});
```

## Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/**/main.ts',
    '!src/**/*.dto.ts',
  ],
};
```

## Mock vs Spy

**Use `jest.fn()` when:**

- Creating mock from scratch
- Complete control over behavior

**Use `jest.spyOn()` when:**

- Spying on existing method
- Need original implementation sometimes

```typescript
// Mock
const mockService = { send: jest.fn().mockResolvedValue(true) };

// Spy
jest.spyOn(emailService, 'send').mockResolvedValue(true);
```

## Test Organization

```typescript
describe('UserService', () => {
  // Happy paths
  describe('Happy Path', () => {
    it('should create user', () => {});
  });

  // Error cases
  describe('Error Cases', () => {
    it('should throw on duplicate email', () => {});
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle concurrent requests', () => {});
  });
});
```

## Best Practices

1. **Coverage Target**: 80-90% (100% often impractical)
2. **Test Naming**: Describe behavior, not implementation
3. **Cleanup**: Always use `afterEach` to clear mocks
4. **Isolation**: Each test should run independently
5. **Fast Unit Tests**: Run in parallel with `--maxWorkers=4`
6. **Repository tests**: Prefer `mongodb-memory-server`; fallback to `mockingoose` or chain helpers
7. **Real E2E**: Use in-memory Mongo or Docker — never mock Mongoose in E2E

## Common Mistakes

| Mistake | Fix |
| ----------------------- | ------------------------------------ |
| Testing private methods | Test through public API |
| Mocking DB in E2E | Use real test database |
| Shared test state | Clear mocks in afterEach |
| No resource cleanup | Close app/DB in afterAll |
| Mocking Mongoose chains inline | Use in-memory Mongo, mockingoose, or shared helpers — see mongoose-testing.md |
| Mocking Model at service layer | Mock repository instead |
| Happy-path-only controller specs | Add error propagation tests for create/findOne/update/remove |
| Happy-path-only E2E | Add 400/404/409 error scenarios |
| Plain `INestApplication` in E2E | Use `INestApplication<App>` from supertest/types |
| App recreated per E2E test | Use beforeAll/afterAll unless project reference does otherwise |
