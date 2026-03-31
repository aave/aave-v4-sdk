---
"@aave/graphql": patch
"@aave/client": patch
"@aave/react": patch
"@aave/cli": patch
---

Add PositionSwapSetCollateralApproval support for V4 adapter refactor

- Add PositionSwapSetCollateralApproval fragment and union variant to graphql package
- Add setCollateralSignature field to PreparePositionSwapRequest
- Handle new approval type in signApprovals helper (spec) and processApprovals (react)
- Update schema from backend with new V4 adapter types
