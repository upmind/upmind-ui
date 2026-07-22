> Companion to [agent-token-budget.md](./agent-token-budget.md) — Upmind-monorepo-specific bindings/examples.

# Token budget — Upmind account bindings

The base rule owns the portable laws (model tiering, bounded fan-out, batching, budget floor + graceful stop + resume) and their neutral formulas. This companion owns only the numeric caps this account binds — the values the base leaves as operator-declared scope.

## This account's fan-out bindings

| Binding | Value | Applies to |
| --- | --- | --- |
| `maxAgents` (total-agent cap) | **40** (default) | fix runs / wave-runner fan-outs |
| `reserve` (budget-floor fraction) | **0.3** | every budget-guarded run |

- **`maxAgents: 40`** is the default total-agent ceiling for fix runs — the Gap-1 bounded-fan-out cap, not the concurrency limit. A runner may scope higher/lower per its declared budget target, but absent an explicit override, fix runs stop gracefully at 40.
- **`reserve: 0.3`** keeps 30% of the launch budget target unspent as graceful-stop headroom (the base rule's budget-floor fraction).

## Why these values (this account)

This account is on **metered session and week limits** — the same limits an unbounded run once exhausted mid-loop. The caps exist so a fan-out stops on a self-declared proxy ceiling well before it hits the provider's hard session/week limit and starts thrashing dead agents. The base rule's honest ruling stands: the runner **cannot** read the live session/week remaining quota, so these are proxy ceilings, not a live meter. The metered limits are the reason the defaults are this conservative.
