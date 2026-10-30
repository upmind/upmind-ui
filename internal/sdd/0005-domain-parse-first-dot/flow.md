---
type: sdd-flow
title: domain-parse-first-dot — flow
description: The DAC basket step that FE-3580 touches.
tags: [sdd, domain, dac, hotfix]
spec: internal/specs/0005-domain-parse-first-dot.md
story: FE-3580
generated: {by: planner/opus, at: 2026-10-30T00:00:00Z}
verified: []
sources: []
stage: draft
---

# Flow: domain-parse-first-dot

## Overview

The DAC machine turns basket products into domain rows. The `setBasketProducts` action calls `parseBasketProduct` for each product. The change touches this action only.

## State Diagram

Not applicable. No state or transition changes.

## Step-by-Step Flow

### 1. The basket updates

- **Trigger:** a basket event that runs `setBasketProducts`.
- **What happens:** each domain product becomes a row with its SLD, TLD and domain. A product that does not parse gives no row.
- **Next:** the same state as today.
