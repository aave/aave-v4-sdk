---
name: publish
description: Use when publishing SDK packages to npm registry, after all changes are merged to main
---

# Publish SDK Packages

Publishes @aave packages to npm using changesets.

## Checklist

**You MUST use TodoWrite to create a todo for EACH step below. Mark each complete only after verification.**

### Pre-flight

- [ ] Verify on `main` branch and up-to-date: `git checkout main && git pull`
- [ ] Verify working directory is clean: `git status` shows no uncommitted changes
- [ ] Run `nvm use` to ensure correct Node.js version
- [ ] Run `corepack enable` to ensure correct pnpm version
- [ ] Run `pnpm install` to update dependencies
- [ ] Run `pnpm build` to build all packages
- [ ] Run `pnpm test --run` to verify tests pass

### Version Bump

- [ ] Check for pending changesets: `ls .changeset/*.md` (if only README.md exists, nothing to publish - STOP)
- [ ] Check pre-release mode: if `.changeset/pre.json` exists, you're in pre-release mode
- [ ] Run `pnpm changeset version` to bump versions
- [ ] If in pre-release mode: review output for "major" bumps - ask user to confirm if any found
- [ ] Stage and commit: `git add . && git commit -m "chore: bumps up versions"`

### Publish

- [ ] Verify npm authentication: run `pnpm whoami`
  - If it fails: ask user to run `pnpm login` then re-verify
- [ ] Ask user for npm OTP code (from authenticator app)
- [ ] Run `NPM_CONFIG_OTP=<otp> pnpm changeset publish` with the provided OTP
  - If OTP expires mid-publish: ask for new OTP and retry failed packages manually
  - If publish fails partially: check npm for which packages published, may need manual recovery
- [ ] Run `git push --follow-tags`

### Post-publish

- [ ] Regenerate CLI README: run `cd packages/cli && pnpm oclif readme && cd ../..`
- [ ] Check for changes: `git status packages/cli/README.md`
- [ ] If changed: `git add packages/cli/README.md && git commit -m "chore: update CLI README" && git push`

## Stop Conditions

| Condition | Action |
|-----------|--------|
| Not on main branch | `git checkout main && git pull` first |
| Uncommitted changes | Stash or commit first |
| Tests failing | Fix tests before publishing |
| No changesets (only README.md in .changeset/) | Nothing to publish - inform user |
| `pnpm whoami` fails | User must run `pnpm login` |
| Major bump in pre-release mode | Confirm with user - may be unintentional |

## Pre-release Mode

When `.changeset/pre.json` exists:
- Packages publish with `-next.N` suffix (e.g., `4.1.0-next.16`)
- Major version bumps should be rare - verify intentional
- The `tag` field in `pre.json` shows the npm dist-tag (`next`)

## Common Mistakes

1. **Skipping `nvm use`** - Wrong Node version causes build failures
2. **Skipping tests** - Publishing broken code to npm
3. **Forgetting `--follow-tags`** - Git tags not pushed, npm versions unlinked
4. **Skipping CLI README** - Documentation becomes stale
5. **Not checking pre-release mode** - Accidental major version bumps
