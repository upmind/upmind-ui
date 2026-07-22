> Companion to the upmind-agent skill /code-migrate-ui — Upmind-monorepo-specific bindings/overrides.

Binds the generic "git host" and "issue tracker" of the base skill to the systems this repo actually runs on. These change where the agent looks in Layer 4 and where the audit trail lands.

## Git host — GitLab

The **git host** is GitLab (`git.upmind.io`). The change request is a **merge request (MR)**.

- **Layer 4:** search merged and open **MRs** on `git.upmind.io` touching the component; MR discussion threads carry design rulings that must be honoured or explicitly superseded.
- **Layer-4 output:** ship the migration as a **GitLab MR** on the story's feature branch — create it with `/mr-create` following the `gitBranchName` convention.

## Issue tracker — Linear

The **issue tracker** is **Linear**.

- **Layer 4:** search Linear issues and comments referencing the component for decisions, deferrals, and `Dropped`/`NOT-SUPPORTED` rulings.
- **Drop token:** an operator-signed drop is written `Dropped — LIN-NNN`, pointing at the Linear issue carrying the sign-off. An unsigned drop remains a scope-purity violation — halt and escalate.
- **Layer-4 output:** post the completed **Property Mapping Table** (dispositions, superseded prior decisions, signed drop links) as a **Linear comment on the story**, so the audit trail lives with the issue the migration serves.
