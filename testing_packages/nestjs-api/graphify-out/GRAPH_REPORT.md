# Graph Report - nestjs-api  (2026-06-27)

## Corpus Check
- 32 files · ~2,642 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 120 nodes · 271 edges · 9 communities (5 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6bf18275`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `UsersService` - 12 edges
2. `ProfilesRepository` - 11 edges
3. `ProfilesService` - 11 edges
4. `UsersRepository` - 11 edges
5. `Profile` - 9 edges
6. `ProfilesController` - 9 edges
7. `ProfileDocument` - 9 edges
8. `UserDocument` - 9 edges
9. `User` - 8 edges
10. `UsersController` - 8 edges

## Surprising Connections (you probably didn't know these)
- `createTestApp()` --calls--> `configureApp()`  [EXTRACTED]
  test/helpers/create-test-app.ts → src/setup-app.ts
- `bootstrap()` --calls--> `configureApp()`  [EXTRACTED]
  src/main.ts → src/setup-app.ts

## Import Cycles
- None detected.

## Communities (9 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (10): DatabaseModule, BODY_METHODS, JsonBodyMiddleware, RequestContextMiddleware, RequestLoggerMiddleware, AppController, AppService, asRequestWithContext() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (9): createTestApp(), startMongoMemoryServer(), isRecord(), parseProfileBody(), parseUserBody(), readString(), AppModule, bootstrap() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.40
Nodes (3): Profile, toProfile(), ProfilesService

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (9): CreateUserDto, UpdateUserDto, User, toUser(), ParseObjectIdPipe, UserEntity, UserSchema, UsersController (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.60
Nodes (3): ProfilesModule, ProfileEntity, ProfileSchema

## Knowledge Gaps
- **2 isolated node(s):** `BODY_METHODS`, `RequestWithContext`
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UsersService` connect `Community 3` to `Community 2`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `UsersRepository` connect `Community 5` to `Community 3`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `ProfilesRepository` connect `Community 4` to `Community 10`, `Community 2`, `Community 6`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `BODY_METHODS`, `RequestWithContext` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._