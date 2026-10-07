---
id: svc-shared-factory
when: services split into per-actor files
paths:
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Shared services live in the factory file

When services split by actor, define each service that all actors share in `<module>.services.ts`. An actor file `<module>.services.<actor>.ts` holds only what that actor does differently, and it exports a typed factory. The factory file merges the shared services with the actor's factory. `scopedServices` resolves the arm.

The test: a service with the same body in two actor files is a defect. Move it to the factory file.

```typescript
function scopedServices(actor: ScopeActorTypes): AuthServices {
  switch (actor) {
    case ScopeActorTypes.STAFF:
      return { checkSession, parse, ...createStaffAuthServices() };
    default:
      return { checkSession, parse, ...createClientAuthServices() };
  }
}
```

Exemplar: `packages/headless/src/modules/auth/`. The `auth.services.ts` factory has the arms `auth.services.client.ts`, `auth.services.guest.ts` and `auth.services.staff.ts`.
