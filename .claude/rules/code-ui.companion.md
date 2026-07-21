> Companion to [code-ui.md](./code-ui.md) — Upmind-monorepo-specific bindings/examples.

## JSON/UI Schema Conventions (Uischema / JSONForms)

This monorepo authors forms and dynamic UI from a JSONForms-based **`Uischema`** system. On top of the base UI-authoring rules:

- Use `Uischema` (lowercase 's'): `useLoginUischema`.
- **All uischema elements MUST have an `i18n` property** — no rendered label/copy is hardcoded; it is resolved through the `i18n` key. This is mandatory and non-negotiable in this repo.

```typescript
// CORRECT
{ type: "Control", scope: "#/properties/username", i18n: "form.auth_email", options: { ... } }
// WRONG - Missing i18n
{ type: "Control", scope: "#/properties/username" }
```

### Review checklist addition

- [ ] Every uischema element has an `i18n` property
