---
description: how to create atomic commits with changesets for release
---

# Create Release with Changesets

This workflow guides you through creating **atomic commits** with proper **changesets** for version management.

## Prerequisites

- Uncommitted changes in the working tree
- Understanding of Semantic Versioning (major/minor/patch)
- Understanding of Conventional Commits

---

## Golden Rules for Commits

Before creating commits, understand these fundamental principles:

### Rule 1: Single Logical Purpose (The "And" Test)

✅ **Good**: "Add chat history database schema"  
❌ **Bad**: "Add chat history schema **and** update docs **and** fix admin bug"

**Test**: If your commit description uses "and", it's probably 2+ commits.

### Rule 2: Atomic & Revertible (The Revert Test)

**Question**: If you had to revert this commit 6 months from now, would it cleanly remove ONE thing?

✅ **Good**: Revert "Add file logging" → Logging gone, everything else works  
❌ **Bad**: Revert "Update docs, infra, web" → What did we just lose? Is anything broken?

### Rule 3: Separate Concerns (The Intent Test)

**Never mix:**

- Refactoring ≠ New features
- Dependencies ≠ Business logic
- Bug fixes ≠ New features
- Docs ≠ Code (unless the doc IS the deliverable)

**Exceptions:**

- ✅ Tests with implementation
- ✅ Lock files with package.json (ALWAYS together)
- ✅ Types/schemas with their usage (if tightly coupled)

### Rule 4: Scope by Purpose, Not File Type

❌ **Bad**: "Update all TypeScript files"  
❌ **Bad**: "Fix linting in packages/"  
✅ **Good**: "Add user authentication to admin panel"  
✅ **Good**: "Fix SQL injection in query builder"

**Think**: What is the USER or DEVELOPER impact?

### Rule 5: Working State (The Build Test)

Each commit should leave the system in a working state.

**In Monorepos with Interdependencies:**

- **Tightly coupled feature** (schema → service → UI): May need single commit
- **Independent improvements**: Separate commits
- **Balance**: Reviewability vs. compilation

### Rule 6: Dependencies and Lock Files

**Golden Rule**: Lock file updates ALWAYS committed WITH the `package.json` change.

❌ **Never**: Separate `package.json` and `bun.lock` into different commits  
✅ **Always**: Together, as one atomic change

---

## Granularity Decision Tree

Use this to decide if a change should be one commit or split:

```
Can I describe this without using "and"?
  └─ NO → Split into multiple commits
  └─ YES → Continue

Does this change multiple independent subsystems?
  └─ YES → Split by subsystem
  └─ NO → Continue

Is this a refactor + feature + docs?
  └─ YES → Split by intent (refactor, then feature, then docs)
  └─ NO → Continue

Would reverting this cleanly remove ONE thing?
  └─ NO → Split further
  └─ YES → Good to commit!
```

**Granularity varies by:**

- Tight coupling (schema + types may be one commit)
- Feature complexity (multi-layer features may span commits)
- Review context (related changes easier to review together)

**No strict line limits** - focus on single purpose and reviewability.

---

## Workflow Steps

### 1. Review All Changes

```bash
# See summary of changes
git diff --stat

# See full diff (be careful with large diffs)
git diff
```

### 2. Categorize Changes by Intent

Group uncommitted changes by **intent**, not just by package:

**Categories:**

1. **Features** (new capabilities)
2. **Fixes** (bug corrections)
3. **Refactors** (code quality, no behavior change)
4. **Chores** (deps, config, tooling)
5. **Docs** (documentation only)

**Within each category, group by:**

- Single responsibility
- Logical cohesion
- Independent vs. coupled changes

**Example Categorization:**

```
Features:
  - Add chat history schema (database)
  - Add conversation service (core)
  - Add chat UI (web)

Fixes:
  - Fix admin sidebar persistence (admin)

Chores:
  - Remove legacy queue UI (worker)
  - Add Radix UI dependencies (ui)

Docs:
  - Update PATTERNS.md with chat architecture
  - Update AGENT_GUIDE.md logging section
```

### 3. Plan Commit Order (Dependency-First)

Commit in dependency order when possible:

```
1. Schema/types (foundation)
2. Repositories (data access)
3. Services (business logic)
4. APIs/Actions (interface)
5. UI (presentation)
6. Docs (explanation)
```

**Why**: Each layer can reference the previous, making review easier.

### 4. Create Changesets (Non-Interactive)

For commits affecting **versioned packages**, create changeset files **manually**.

**Changeset File Format:**

```markdown
---
"<package-name>": <major|minor|patch>
---

<commit-type>: <short description>

<optional longer description>
```

**Version Bump Rules:**

- `major`: Breaking changes (rare, requires migration)
- `minor`: New features, new exports, schema additions
- `patch`: Bug fixes, refactors, improvements

**Example: `.changeset/add-chat-schema.md`**

```markdown
---
"@repo/database": minor
---

feat: add agent conversations schema

Add database tables for chat history persistence with org-scoped, user-owned data isolation.
```

**Where to create:**

- Directory: `.changeset/`
- Naming: `<descriptive-kebab-case>.md`

**Which commits need changesets?**

- ✅ Changes to `packages/*` (database, core, ui, config)
- ✅ Changes to `apps/*` (admin, web, worker, api)
- ❌ Documentation-only commits
- ❌ Pure config/infra changes (unless versioned)

**Changesets vs. Commits:**

- **NOT 1:1 mapping** - One changeset can cover multiple commits
- **Group by feature** - Multi-commit features can share one changeset
- **Version intent** - Changesets track version bumps, not code history

### 5. Create Atomic Commits

For each logical group:

```bash
# Stage specific files (including changeset if applicable)
git add <file1> <file2> <file3> .changeset/<changeset-file>.md

# Commit with proper message
git commit -m "<type>(<scope>): <what was done>

Why: <business or technical reason>

Changes:
- <change with context or impact>
- <change with context or impact>"
```

**Commit Message Format:**

```
<type>(<scope>): <what was done - user/dev perspective>

Why: <business or technical reason for this change>

Changes:
- <change with impact or context>
- <change with impact or context>

[Optional] Breaking Change: <what breaks and how to fix>
[Optional] Migration Required: <steps to migrate>
```

**Types:**

- `feat`: New features
- `fix`: Bug fixes
- `chore`: Maintenance, tooling, dependencies
- `refactor`: Code restructuring (no behavior change)
- `docs`: Documentation only

**Scopes (optional but recommended):**

- `database`, `core`, `ui`, `admin`, `web`, `worker`, `api`, `infra`

### 6. Example Commit Sequence

```bash
# Commit 1: Database Schema
git add packages/database/ .changeset/add-chat-schema.md
git commit -m "feat(database): add chat history persistence

Why: Enable multi-turn conversations with proper org-scoped,
user-owned data isolation for AI Studio.

Changes:
- Add agent_conversations table (org + user scoped)
- Add agent_messages table with cascade deletes and sequencing
- Generate Zod schemas for type-safe validation

Migration Required: Run \`bun db:push\` to apply schema changes"

# Commit 2: Service Layer
git add packages/core/src/services/ packages/core/src/repositories/
git commit -m "feat(core): add conversation management service

Why: Provide CRUD operations for chat history with proper
authorization and org/user scoping.

Changes:
- Implement AgentConversationService for conversation lifecycle
- Add AgentConversationRepository for data access
- Add AgentMessageRepository for message persistence"

# Commit 3: Bug Fix (separate from features)
git add apps/admin/app/\(dashboard\)/
git commit -m "fix(admin): persist sidebar when navigating to queues

Why: Users lost navigation context when viewing queue dashboard,
breaking expected UX pattern.

Changes:
- Move /queues route into (dashboard) layout group
- Update queue action imports to new relative path"

# Commit 4: Dependencies (with lock file)
git add packages/ui/package.json bun.lock
git commit -m "chore(ui): add Radix UI dialog and dropdown dependencies

Why: Required for new sheet and dropdown-menu components.

Changes:
- Add @radix-ui/react-dialog@^1.1.15
- Add @radix-ui/react-dropdown-menu@^2.1.16
- Update bun.lock"

# Commit 5: Documentation (no changeset)
git add docs/
git commit -m "docs: add chat history patterns and logging guide

Why: Document new architecture and debugging workflows for
future development.

Changes:
- Add chat history architecture to PATTERNS.md
- Update AGENT_GUIDE.md with logging infrastructure
- Document debugging patterns for agent interactions"
```

### 7. Verify Commits

```bash
# Check commit history
git log --oneline -10

# Review each commit individually
git show HEAD
git show HEAD~1

# Verify working tree is clean
git status

# List changesets
ls -1 .changeset/*.md | grep -v README
```

### 8. Release (When Ready)

```bash
# Generate CHANGELOGs and update package.json versions
bun run version-packages

# This will:
# 1. Read all .changeset/*.md files
# 2. Update package.json versions based on semver
# 3. Generate/update CHANGELOG.md files
# 4. Delete consumed changeset files

# Review the version changes
git diff

# Commit version bump
git add .
git commit -m "chore: version packages"

# Push to remote
git push origin main
```

---

## Best Practices

### ✅ Do:

- **Single purpose per commit** - Use the "and" test
- **Explain "why"** - Include business/technical context
- **Commit in dependency order** - Schema → Service → UI
- **Keep lock files with package.json** - Always together
- **Separate concerns** - Features ≠ Fixes ≠ Refactors ≠ Docs
- **Make commits revertible** - Each should remove ONE thing
- **Leave system working** - Each commit compiles/runs

### ❌ Don't:

- **Mix unrelated changes** - Different "why" = different commits
- **Vague messages** - "fix stuff", "misc updates"
- **Separate package.json and lock file** - Always together
- **Mix refactors with features** - Separate the cleanup from new code
- **Dump unrelated changes** - "Update docs, infra, and web"
- **Forget changesets** - Required for version management
- **Break the build** - Each commit should be functional

---

## Troubleshooting

**Q: I have too many uncommitted changes. How do I split them?**  
A: Categorize by intent first (features, fixes, chores, docs), then use `git add <specific-files>` for selective staging.

**Q: What if I staged the wrong files?**  
A: `git reset HEAD <file>` to unstage, then re-add correctly.

**Q: Should I split a tightly-coupled feature across commits?**  
A: Balance reviewability vs. compilation. If schema → service → UI are tightly coupled, one commit may be better than 3 broken commits.

**Q: Can I have multiple commits with one changeset?**  
A: Yes! Changesets track version bumps, not code history. One feature across 3 commits = 1 changeset covering all 3 packages.

**Q: What if I forget a changeset?**  
A: Create it and amend: `git add .changeset/file.md && git commit --amend --no-edit`

**Q: How do I handle "misc cleanups"?**  
A: Don't. Each cleanup should be its own commit with a clear reason. "Misc" is a code smell.

---

## Example: Full Multi-Commit Feature

**Scenario**: Add chat history feature (database + service + UI)

### Option A: Multi-Commit with Single Changeset

```bash
# Commit 1: Foundation
git add packages/database/
git commit -m "feat(database): add chat history schema..."

# Commit 2: Business Logic
git add packages/core/
git commit -m "feat(core): add conversation service..."

# Commit 3: Presentation
git add apps/web/
git commit -m "feat(web): add chat history UI..."

# One changeset covering all 3
# .changeset/add-chat-history.md:
---
"@repo/database": minor
"@repo/core": minor
"web": minor
---
feat: add chat history persistence

Full chat history feature with database schema, services, and UI.

# Add changeset to last commit
git add .changeset/add-chat-history.md
git commit --amend --no-edit
```

### Option B: Independent Commits with Separate Changesets

```bash
# If changes are independent (e.g., unrelated bug fixes)
git add <fix1-files> .changeset/fix1.md
git commit -m "fix(admin): ..."

git add <fix2-files> .changeset/fix2.md
git commit -m "fix(web): ..."
```

---

**Done!** Your changes are committed following best practices for atomic, reviewable, revertible commits with proper version management.
