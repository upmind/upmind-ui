# `tests/quarantine/`

Mechanical enforcement of [ADR 021's flakiness policy](../../docs/adr/021-testing-pyramid-and-agentic-workflow.md#flakiness-policy) (FE-2776). Dependency-free Node — no `pnpm install` needed to run.

| Script                    | pnpm script          | Does                                                                      |
| ------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `lint-quarantine.mjs`     | `lint:quarantine`    | Fails if a static `.skip` lacks a valid `@quarantine(<id>, <date>)`.      |
| `list-quarantined.mjs`    | `test:quarantined`   | Lists quarantined tests by age (`--age`, `--json`).                       |
| `allure-flaky-report.mjs` | `quarantine:flaky`   | Surfaces tests that flaked twice in 30 days (Allure history query).       |
| `quarantine-enforce.mjs`  | `quarantine:enforce` | Day-25 Linear reminder (`--remind`) + day-30 deadline fail (`--enforce`). |

- Shared logic: [`lib/quarantine.mjs`](./lib/quarantine.mjs).
- Grandfathered pre-existing debt: [`quarantine-baseline.json`](./quarantine-baseline.json) (regenerate with `pnpm lint:quarantine --update-baseline`).
- CI wiring: [`.gitlab-ci/quarantine.yml`](../../.gitlab-ci/quarantine.yml).
- Full docs: [`tests/quarantine/docs/14-quarantine-tooling.md`](../../tests/quarantine/docs/14-quarantine-tooling.md).
