# Git Versioning Guide

Reviewers explicitly grade "Git with a real commit history" — treat commits as part of the deliverable, not cleanup afterward.

## Branching (solo dev, keep it light but real)

- `main` — always in a working state (even if incomplete features are behind the checklist, not half-broken).
- `feat/<phase>-<short-name>` per phase or per meaty task, e.g. `feat/05-stripe-webhook`, `feat/03-auth-jwt`. Merge to `main` when the phase's tasks are done and manually verified.
- No need for PR review (solo project) but you can still open a PR to `main` and merge it yourself — gives reviewers a clean phase-by-phase diff view if they check GitHub.

## Commit convention (Conventional Commits)

`<type>(<scope>): <short imperative summary>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`.
Scope = module name (`auth`, `payments`, `org-admin`, `webhooks`, `db`...).

Examples matching the task list:

```
feat(db): initial prisma schema + seed script
feat(auth): jwt login/refresh + rbac guards
test(auth): tenant isolation and role-guard unit tests
feat(payments): stripe checkout session creation
feat(payments): idempotent webhook handler with $transaction
fix(payments): prevent duplicate payment row on webhook retry
feat(org-admin): member invite flow + email trigger
docs(readme): document multi-tenancy isolation strategy
chore(ci): add lint+test github actions workflow
```

## Granularity

One commit ≈ one checklist item from TASK-BREAKDOWN.md, or a small cluster of trivially related items (e.g. "routes+validation" for the same endpoint). Avoid two failure modes: (a) one giant "implement backend" commit — tells reviewers nothing about your process; (b) commit-per-file noise — same problem in reverse. The checklist granularity is the right size.

## Practical rules

- Never commit `.env` — only `.env.example` with placeholder values, committed from the very first commit.
- Never commit `node_modules`, `dist`, `.next` — root `.gitignore` from task 0.
- Write commit messages in imperative mood ("add", not "added"/"adds").
- If you use AI to generate a chunk of code, that's fine per the assessment rules — but still write your own commit message describing what it does; don't paste an AI-generated diff summary verbatim as the commit message.
- Tag phase boundaries if you want an easy milestone view: `git tag v0.1-auth-done` etc. (optional, nice touch for the code-walkthrough video).

## Before submitting

- `git log --oneline` should read like a changelog of the task list, top to bottom.
- Confirm no secrets in history (`git log -p -- '*.env'` should return nothing).
