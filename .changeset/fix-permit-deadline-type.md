---
"@aave/client": patch
"@aave/react": patch
---

**fix:** cast `PermitTypedData.message.deadline` to `number` to align with `ERC20PermitSignature` input type after GraphQL schema update
