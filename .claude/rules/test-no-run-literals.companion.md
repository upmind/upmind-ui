---
id: test-no-run-literals
paths:
  - 'packages/**/__tests__/**/*.{ts,js}'
  - 'packages/**/*.{test,spec}.{ts,js}'
  - 'tests/**/*.{ts,js}'
  - 'packages/**/__tests__/*.feature'
---
# Run literals — monorepo bindings

- A scenario step reads the record ids it acts on from the step recording that addressed them (ADR 035, Decision 6).
- Assert the business outcome from the recorded rows and totals. Do not assert a computed count, a masked name or only the request state.
- An address on `example.com` is not masked.
