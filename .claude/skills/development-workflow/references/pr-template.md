# Pull Request Process

## Creating a PR

### 1. Verify Readiness

Before creating PR:
- [ ] All tests passing
- [ ] Lint passing
- [ ] Build succeeds
- [ ] `production-code-validator` passed (Standard/Complex)
- [ ] Ticket acceptance criteria updated with `[x]`

### 2. Push and Create PR

```bash
git push -u origin feature/sprint0-B0.1-task-name

gh pr create --title "feat(scope): description" --body "$(cat <<'EOF'
## Summary
[Brief description]

## Task
- Task ID: [B0.1]
- Sprint: [0]
- Complexity: [Simple/Standard/Complex]

## Changes
- Change 1
- Change 2

## Testing
- [x] All tests passing
- [x] Lint passing
- [x] Build succeeds
- [x] Validated with production-code-validator

## Checklist
- [ ] Ticket acceptance criteria updated
- [ ] Code reviewed
- [ ] Ready to merge

🤖 Generated with Claude Code
EOF
)"
```

---

## Review Process

### For Simple Tasks
- Auto-merge allowed if checks pass

### For Standard/Complex Tasks
1. Run `code-review-specialist` agent
2. Wait for human reviewer
3. Address comments
4. Get approval
5. Merge

---

## Merge Process

```bash
# Squash and merge (preferred)
gh pr merge --squash

# After merge
git checkout main
git pull
git branch -d feature/sprint0-B0.1-task-name
```

---

## Handling Merge Conflicts

```bash
git checkout main
git pull
git checkout feature/sprint0-B0.1-task-name
git rebase main
# Resolve conflicts
git add <resolved-files>
git rebase --continue
git push --force-with-lease
```

---

## PR Title Convention

Format: `<type>(<scope>): <description>`

| Type | Use For |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| refactor | Code restructuring |
| test | Tests only |
| chore | Build/config |
