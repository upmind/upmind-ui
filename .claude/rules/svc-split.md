---
id: svc-split
when: two actors share a service
paths:
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Split a service by actor only when the work differs

Decide once if two actors share one service or get one service each. Use this table.

| Between the actors | Decision |
| --- | --- |
| different endpoints, grant types, response shapes or business logic | split into per-actor files (svc-shared-factory) |
| different permissions, with a simple check | one service with an actor guard |
| different permissions, with diverging workflows | split |
| same endpoint, and the server filters by actor | one service |
| same endpoint and same data | one service |

Do not split when the actor files would hit the same endpoint with the same logic. Do split when one service branches on the actor across grant type, flow and endpoint.

Record the decision in the ADR or the story. Do not narrate it in a code comment.

The actor resolves to two enums, by site:

- The factory and the scoping (`scopedServices`, the machine-services wiring) use `ScopeActorTypes.CLIENT` and `ScopeActorTypes.STAFF`. The guest flows through the same machinery.
- Permission guards and actor-check branches use `AccessRoleTypes.CLIENT` and `AccessRoleTypes.STAFF`.

A user is `.CLIENT`. An admin or privileged actor is `.STAFF`. The client grant is `GrantTypes.PASSWORD`. The staff grant is `GrantTypes.ADMIN`.

Worked examples and the decision flowchart: `docs/reference/service-splitting-examples.md`.
