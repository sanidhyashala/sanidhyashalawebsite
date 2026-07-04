# Git Workflow

Version: 1.0

---

# Purpose

Maintain a clean, understandable, and reliable Git history.

Every commit should tell the story of the project.

---

# Main Branch

main

Always stable.

Never push experimental work directly.

---

# Development Rule

Work locally.

↓

Test.

↓

Build.

↓

Commit.

↓

Push.

Never push untested code.

---

# Commit Style

Good Examples

feat: add mobile PDF zoom controls

fix: resolve PDF reader loading issue

refactor: simplify resource registry

docs: update architecture documentation

style: improve mobile navigation spacing

perf: optimise PDF rendering

---

Bad Examples

update

changes

new code

fix

final

last

test

---

# Commit Frequency

Commit after every completed feature.

Avoid huge commits covering many unrelated changes.

---

# Before Every Push

Run:

npm run build

Ensure:

Build succeeds.

No TypeScript errors.

No ESLint errors (when enabled).

Application works locally.

---

# Push Strategy

Feature Complete

↓

Build Successful

↓

Commit

↓

Push

↓

Update Roadmap

↓

Update Decision Log (if needed)

---

# Documentation Rule

Major architectural changes require updating:

Roadmap

Decision Log

Relevant documentation

Documentation should evolve with the code.

---

# Release Tags

Major milestones may receive version tags.

Examples

v1.0 Foundation

v1.1 Reader

v1.2 Search

v2.0 Admin CMS

---

# Rollback Principle

Small commits make rollback easier.

Never combine unrelated work into one commit.

---

# Repository Philosophy

The Git history should read like a development diary.

Every meaningful improvement deserves its own commit.

---

# Golden Rule

If future-you cannot understand today's commit message,

rewrite it before pushing.

---

End of Git Workflow