# Graph Report - .  (2026-06-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 136 nodes · 362 edges · 13 communities (4 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `880bd80a`
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
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `UsersService` - 15 edges
2. `ProfilesRepository` - 13 edges
3. `ProfilesService` - 13 edges
4. `UsersRepository` - 13 edges
5. `ProfileDocument` - 12 edges
6. `UserDocument` - 12 edges
7. `Profile` - 11 edges
8. `CreateProfileDto` - 10 edges
9. `UpdateProfileDto` - 10 edges
10. `ProfilesController` - 10 edges

## Surprising Connections (you probably didn't know these)
- `createTestApp()` --calls--> `configureApp()`  [EXTRACTED]
  test/helpers/create-test-app.ts → src/setup-app.ts
- `bootstrap()` --calls--> `configureApp()`  [EXTRACTED]
  src/main.ts → src/setup-app.ts

## Import Cycles
- None detected.

## Communities (13 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (11): DatabaseModule, BODY_METHODS, JsonBodyMiddleware, RequestContextMiddleware, RequestLoggerMiddleware, ProfilesModule, AppController, AppService (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.26
Nodes (9): createTestApp(), startMongoMemoryServer(), isRecord(), parseProfileBody(), parseUserBody(), readString(), AppModule, bootstrap() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.42
Nodes (3): Profile, toProfile(), ProfilesService

### Community 3 - "Community 3"
Cohesion: 0.38
Nodes (3): User, toUser(), UsersService

## Knowledge Gaps
- **1 isolated node(s):** `BODY_METHODS`
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UsersService` connect `Community 3` to `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 11`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `UsersRepository` connect `Community 5` to `Community 11`, `Community 7`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `ProfilesRepository` connect `Community 4` to `Community 10`, `Community 6`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `BODY_METHODS` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12807881773399016 - nodes in this community are weakly interconnected._