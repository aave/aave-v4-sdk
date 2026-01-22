---
name: schema-update
description: Use when updating the SDK GraphQL schema from a local or staging API server
---

# Update GraphQL Schema

Updates the SDK's GraphQL schema and related types from an API server instance.

## Usage

```
/schema-update local    # Download from local server
/schema-update staging  # Download from staging server
/schema-update          # Will prompt for server choice
```

## Checklist

**You MUST use TodoWrite to create a todo for EACH step below. Mark each complete only after verification.**

### Download Schema

- [ ] Determine server source (from argument or ask user): `local` or `staging`
- [ ] Run schema download from `packages/graphql`:
  - Local: `pnpm gql:download:local`
  - Staging: `pnpm gql:download:staging`
- [ ] Run `pnpm gql:generate:introspection` to generate GraphQL documents

### Update Documents

- [ ] Cross-reference `packages/graphql/schema.graphql` with existing GQL documents
- [ ] Add missing fields to existing fragments
- [ ] Introduce new fragments if necessary
- [ ] If new queries or mutations exist in schema, ask user if they should be added

### Check for New Enums

- [ ] Search for new `enum` definitions in `packages/graphql/schema.graphql`
- [ ] For each new enum:
  - Add enum definition to `packages/graphql/src/enums.ts` with JSDoc comments
  - Import the enum type in `packages/graphql/src/graphql.ts`
  - Add scalar binding in `graphql` config (alphabetically ordered)
- [ ] Note: Do NOT create separate type exports for enums - the enum definition serves as both value and type

### Export Input Types

- [ ] Check for new input types in schema
- [ ] Common types (used across multiple queries): export from `packages/graphql/src/inputs.ts`
- [ ] Query-specific types: colocate with corresponding query files (permits.ts, transactions.ts, swaps.ts, user.ts, reserve.ts, hub.ts, misc.ts)
- [ ] Use pattern: `export type InputName = ReturnType<typeof graphql.scalar<'InputName'>>;`
- [ ] Exclude fork-related input types unless explicitly needed
- [ ] Ensure scalar bindings exist in `graphql.ts` for all input types

### Validate

- [ ] Run `pnpm check` from `packages/graphql` to verify document integrity
- [ ] Run `pnpm build` to ensure TypeScript compilation succeeds
- [ ] Run `pnpm test --run` to verify tests pass
- [ ] Run `pnpm lint:fix` to format code

## Code Patterns

### Enum Definition (enums.ts)

```typescript
/**
 * Description of what this enum represents.
 */
export enum EnumName {
  /**
   * Description of this value
   */
  VALUE_ONE = 'VALUE_ONE',
  /**
   * Description of this value
   */
  VALUE_TWO = 'VALUE_TWO',
}
```

### Scalar Binding (graphql.ts)

```typescript
// Add to imports
import type { ..., EnumName } from './enums';

// Add to scalars config (alphabetically)
scalars: {
  ...
  EnumName: EnumName,
  ...
}
```

### Input Type Export

```typescript
export type InputName = ReturnType<typeof graphql.scalar<'InputName'>>;
```

## Stop Conditions

| Condition | Action |
|-----------|--------|
| Schema download fails | Check if server is running, verify URL |
| `pnpm check` fails | Fix document errors before proceeding |
| Build fails | Fix TypeScript errors |
| Tests fail | Investigate and fix failing tests |

## Common Mistakes

1. **Creating type exports for enums** - Enums are both values and types; don't use `ReturnType<typeof graphql.scalar<'EnumName'>>`
2. **Adding new queries/mutations without being asked** - Only update existing documents unless explicitly requested
3. **Forgetting scalar bindings** - Every input type needs a corresponding entry in `graphql.ts`
4. **Non-alphabetical ordering** - Scalar bindings should be alphabetically ordered
5. **Missing JSDoc comments** - All enums should have documentation
