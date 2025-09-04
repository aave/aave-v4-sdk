# AGENTS.md
 
## Dev environment tips

- Use `nvm use` to use the correct Node.js version.
- Use `corepack enable` to install the correct version of pnpm.
- Use `pnpm install` to install the dependencies.
- Use `pnpm build` to build the project.

## Testing instructions

- Use `pnpm test:client --run` to run `@aave/client` tests.
- Use `pnpm test:react --run` to run `@aave/react` tests.
- Use `pnpm vitest --run --project <project-name> <path-to-test-file> -t "<test-name>"` to focus on one single test.

## GraphQL documents

- Use `pnpm check` from `packages/graphql` to check the integrity of the GraphQL documents.
- Upon schema updates, cross reference the `packages/graphql/schema.graphql` with the GQL documents and adds missing fields, introduce new fragments if necessary.
